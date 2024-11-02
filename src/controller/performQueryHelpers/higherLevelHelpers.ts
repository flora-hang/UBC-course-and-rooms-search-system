// ------------- HELPER IMPORTS -------------
import { InsightError, ResultTooLargeError } from "../../controller/IInsightFacade";
import { filterItems } from "./filterHelpers";
import { groupItems } from "./groupHelpers";
import { applyFunctionItems } from "./applyHelpers";
import { combine2 } from "./groupHelpers";
import { sortResultsGroup, sortResults } from "./sortHelpers";
import { selectColumns, returnResults } from "./returnHelpers";
// ------------- MODEL IMPORTS -------------
import Query from "../../models/query/Query";
import Item from "../../models/query/Item";
import SectionsDataset from "../../models/sections/SectionsDataset";
import RoomsDataset from "../../models/rooms/RoomsDataset";
import { InsightResult } from "../../controller/IInsightFacade";
import ApplyRule from "../../models/query/ApplyRule";

export async function queryItemsDataset(
	validQuery: Query,
	dataset: SectionsDataset | RoomsDataset
): Promise<InsightResult[]> {
	let finalResults: InsightResult[] = [];

	const id = dataset.getId();

	let items: Item[] = null as unknown as Item[];
	if (dataset instanceof SectionsDataset) {
		items = dataset.getSections();
	} else if (dataset instanceof RoomsDataset) {
		items = dataset.getRooms();
	}
	// console.log("> items:", items, items.length);
	const filteredItems = filterItems(validQuery.WHERE.filter, items, id) as Item[];
	// console.log("> filtered items", filteredItems, filteredItems.length);
	// console.log("!!! START OF OIPTIONS BLOCK PARSE");

	// Parse OPTIONS block: Extract columns and order field
	const { columns, orderField } = await parseOptionsBlock(validQuery);

	// Parse TRANSFORMATIONS block: Extract group and apply field
	if (validQuery.TRANSFORMATIONS) {
		finalResults = await parseTransformationsBlock(validQuery, filteredItems, columns, orderField, id);
	} else {
		// sort without group and apply
		if (orderField) {
			finalResults = selectColumns(sortResults(filteredItems, orderField, columns), columns);
		} else {
			finalResults = selectColumns(filteredItems, columns);
		}
	}
	// TODO: add new sort functionality
	// IF TRANSFORMATION block and SORT given: sort the group items
	// ELSE IF only SORT given and TRANSFORMATION block not given: sort the filtered items
	// ELSE: return filtered items

	// if (applyItems) {
	// 	const sortedItems = orderField
	// 		? groups && apply
	// 			? sortResults(groupAndApply, orderField as any, columns)
	// 			: sortResults(groupAndApply, orderField as any, columns)
	// 		: applyItems;

	// 	console.log("> sorted items, size: ", sortedItems);
	// 	// sortedItems is a list of list of objects: [Room{}, Room{}, {maxSeats: 100}], []

	// 	// // Select the required columns
	// 	finalResults = selectColumns(sortedItems, columns);
	// }

	const maxSections = 5000;
	// - check if filtered sections exceed 5000 sections limit
	if (finalResults.length > maxSections) {
		throw new ResultTooLargeError("results exceed size of 5000, size is: " + finalResults.length);
	}
	// console.log("> final results:", finalResults);

	// console.log("> final results[0]:", finalResults[0]);
	// console.log("> final results[1]:", finalResults[1]);
	// console.log("> final results[2]:", finalResults[2]);
	// console.log("> final results[3]:", finalResults[3]);
	// console.log("> final results[4]:", finalResults[4]);
	return finalResults;
}

export async function parseOptionsBlock(validQuery: Query): Promise<{ columns: string[]; orderField: any }> {
	const columns = validQuery.OPTIONS.columns;
	// const orderField = validQuery.OPTIONS.sort?.anyKey
	// 	? validQuery.OPTIONS.sort?.anyKey
	// 	: validQuery.OPTIONS.sort?.dir && validQuery.OPTIONS.sort?.keys
	// 	? { dir: validQuery.OPTIONS.sort?.dir, keys: validQuery.OPTIONS.sort?.keys }
	// 	: null;
	const orderField = validQuery.OPTIONS.sort;
	// console.log("!!! END OF OPTIONS BLOCK PARSE");
	if (!validQuery.OPTIONS.sort?.anyKey && !!validQuery.OPTIONS.sort?.dir !== !!validQuery.OPTIONS.sort?.keys) {
		throw new InsightError("Order is incorrect");
	}

	return { columns, orderField };
}

export async function parseTransformationsBlock(
	validQuery: Query,
	filteredItems: Item[],
	columns: string[],
	orderField: any,
	id: string
): Promise<InsightResult[]> {
	const groups: string[] = validQuery.TRANSFORMATIONS?.group || [];
	const applyRules: ApplyRule[] = validQuery.TRANSFORMATIONS?.apply || [];

	// check that all COLUMNS keys must correspond to one of the GROUP keys or to applykeys
	const applyKeys = applyRules.map((applyRule) => applyRule.applyKey);
	const allValidKeys = new Set([...groups, ...applyKeys]);

	validateColumnsAndApplyKeys(columns, allValidKeys, applyRules, validQuery, groups);

	// group the filtered results into specific groups
	// const groupedItems = groups ? groupItems(filteredItems, groups) : null;
	// console.log("> grouped items, size: ", groupedItems);
	// apply specified APPLYTOKENs if given
	// const applyItems = apply ? applyFunctionItems(groupedItems as (Section | Room)[][], apply) : null;
	// console.log("> grouped and applied items, size: ", applyItems);

	// const groupAndApply = combine(groupedItems, applyItems);

	const groupedItems = groupItems(filteredItems, groups, id);
	// console.log("> grouped items length:", groupedItems?.length);

	const maxSections = 5000;
	// - check if filtered sections exceed 5000 sections limit
	if (groupedItems.length > maxSections) {
		throw new ResultTooLargeError("groupedItems exceed size of 5000, size is: " + groupedItems.length);
	}

	const appliedItems = applyFunctionItems(groupedItems, applyRules, id);
	// console.log("> applied items length:", appliedItems?.length);
	const groupAndApply = combine2(groups, groupedItems, appliedItems);
	// console.log("> combined items: ", groupAndApply);

	if (orderField) {
		const sortedItems = sortResultsGroup(groupAndApply, orderField, columns);
		// console.log("> sorted items:", sortedItems);
		return returnResults(sortedItems, columns);
	} else {
		return returnResults(groupAndApply, columns);
	}
}

function validateColumnsAndApplyKeys(
	columns: string[], allValidKeys: Set<string>,
	applyRules: ApplyRule[], validQuery: Query, groups: string[]): void {
	columns.forEach((column) => {
		if (!allValidKeys.has(column)) {
			throw new InsightError("COLUMNS keys must correspond to one of the GROUP keys or to applykeys");
		}
	});

	const seen = new Set<string>();
	applyRules?.forEach((applyRule) => {
		if (seen.has(applyRule.applyKey)) {
			throw new InsightError("APPLY contains duplicate key");
		}
		seen.add(applyRule.applyKey);
	});

	if (validQuery.TRANSFORMATIONS && !groups) {
		throw new InsightError("Transformations must have a GROUP block");
	} else if (validQuery.TRANSFORMATIONS && !applyRules) {
		throw new InsightError("Transformations must have an APPLY block");
	}
}

