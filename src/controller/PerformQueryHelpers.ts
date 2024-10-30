import Negation from "../models/query/Negation";
import Query from "../models/query/Query";
import Section from "../models/sections/Section";
import Room from "../models/rooms/Room";
import Item from "../models/query/Item";
import { InsightError, InsightResult } from "./IInsightFacade";
import ApplyRule, { useApply } from "../models/query/ApplyRule";
import Sort from "../models/query/Sort";


export function filterItems(where: any, items: Item[], id: string): Item[] {
	// If WHERE block is empty, return all items (no filtering)
	// !!! get all items in the dataset
	// console.log("been in filteredItems");

	if (where === undefined) {
		return items;
	}

	if (where.logic === "AND") {
		return handleAND(where.filters, items, id);
	}
	// console.log("been outside of OR");
	if (where.logic === "OR") {
		// console.log("num sections (OR): %d\n", sections.length);
		// console.log("%s\n", where.filter.filters);
		// console.log("been in OR");
		// console.log("num sections (OR): %d\n", sections.length);
		return handleOR(where.filters, items, id);
	}
	// console.log("been outside of NOT");
	if (where instanceof Negation) {
		// console.log("been in NOT");
		// console.log("num sections (NOT): %d\n", sections.length);
		return handleNOT(where, items, id);
	}

	if (where.mComparator === "EQ") {
		// console.log("been in EQ");
		// console.log("num sections (EQ): %d\n", sections.length);
		return handleEQ(where, items, id);
	}

	if (where.mComparator === "GT") {
		// console.log("been in GT");
		return handleGT(where, items, id);
	}

	if (where.mComparator === "LT") {
		// console.log("been in LT");
		return handleLT(where, items, id);
	}

	if ("skey" in where) {
		// console.log("been in IS");
		return handleIS(where, items, id);
	}

	// If no valid operator is found, return all sections (shouldn't happen)
	return items;
}

function handleAND(conditions: any[], items: Item[], id: string): Item[] {
	// console.log("handleAND");
	let results = items;

	for (const condition of conditions) {
		results = filterItems(condition, results, id) as Item[];
		// console.log("handleAnd: %d\n", results.length);
	}
	// Merge all results (union)
	return results;
}
function handleOR(conditions: any[], items: Item[], id: string): Item[] {
	// console.log("handleOR");
	const results = conditions.map((condition) => filterItems(condition, items, id));
	const newItems = results.flat();
	// console.log("newSections: %d\n", newSections.length);
	const seen = new Set<any>(); // Set to store unique field values

	const ret = newItems.filter((item) => {
		const value = item.getUniqueIdentifier();
		if (seen.has(value)) {
			return false; // Skip duplicate sections
		} else {
			seen.add(value);
			return true; // Keep the unique section
		}
	});
	return ret;
}

function handleNOT(condition: any, items: Item[], id: string): Item[] {
	const filteredItems = filterItems(condition.filter, items, id);
	return items.filter((item) => !filteredItems.includes(item));
}

function handleEQ(condition: any, items: Item[], id: string): any {
	// console.log("handleEQ");
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	const ret = items.filter((item) => item.getField(field) === condition.value);
	return ret as any;
}

function handleGT(condition: any, items: Item[], id: string): any {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"

	const ID: string = condition.mkey.split("_")[0];

	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	// console.log("%d\n", condition.value);
	console.log(field);
	const ret = items.filter((item) => item.getField(field) > condition.value);
	// console.log("%d\n", ret.length);
	return ret as any;
}

function handleLT(condition: any, items: Item[], id: string): any {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	const ret = items.filter((item) => item.getField(field) < condition.value);
	// console.log("handleLT: %d\n", ret.length);
	return ret as any;
}

function handleIS(condition: any, items: Item[], id: string): any {
	const field: string = condition.skey.split("_")[1]; // e.g. "avg"

	const ID: string = condition.skey.split("_")[0];

	if (ID !== id) {
		throw new InsightError("id does not match");
	}

	let ret;
	if (condition.inputString.includes("*")) {
		if (condition.inputString.startsWith("*") && condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length - 1);
			checkWildcardAgain(str);
			console.log("!!!!!!!a", field);
			ret = items.filter((item) => item.getField(field).includes(str));
			return ret as any;
		} else if (condition.inputString.startsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length);
			checkWildcardAgain(str);
			console.log("!!!!!!!b", field);
			ret = items.filter((item) => item.getField(field).endsWith(str));
			return ret as any;
		} else if (condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(0, condition.inputString.length - 1);
			checkWildcardAgain(str);
			console.log("!!!!!!!c", field);
			ret = items.filter((item) => item.getField(field).startsWith(str));
			return ret as any;
		} else {
			throw new InsightError("invalid use of wildcard");
		}
	}

	ret = items.filter((item) => item.getField(field) === condition.inputString);
	// console.log("handleIS: %d\n", ret.length);
	return ret as any;
}

function checkWildcardAgain(str: string): void {
	if (str.includes("*")) {
		throw new InsightError("* in the middle");
	}
}

function mkeyFlag(field: string): boolean {
	switch (field) {
		case "avg":
			return true;
		case "pass":
			return true;
		case "fail":
			return true;
		case "audit":
			return true;
		case "year":
			return true;
		case "lat":
			return true;
		case "lon":
			return true;
		case "seats":
			return true;
		default:
			return false;
	}
}

// TODO: this function might cause errors tbh
export function groupItems(items: Item[], groups: String[], id: string): any {
	console.log("!!! in groupItems"); // items = filteredItems
	// console.log("> groups: %o", groups);
	const groupedItemsMap: Record<string, Item[]> = {}; // Item[] = groupedItems

	items.forEach((item) => {
		// const key = groups.map((group) => (item as any)[group.split("_")[1]]).join("_");

		// Generate the key by accessing the properties specified in the groups array
		const key = groups
			.map((group) => {
				const groupId = group.split("_")[0];
				if (groupId !== id) {
					throw new InsightError("id does not match in GROUP");
				}
				const property = group.split("_")[1];
				// console.log("!!! property: %o", property);
				try {
					const value = item.getField(property);
					return value;
				} catch (error) {
					throw new InsightError("Invalid key in GROUP");
				}
			})
			.join("_");
		// console.log("!!! key: %o", key);

		if (!groupedItemsMap[key]) {
			groupedItemsMap[key] = [item];
		} else {
			groupedItemsMap[key].push(item);
		}
	});
	console.log("---------------------------------");
	console.log("in helper:", groupedItemsMap.length);
	return Object.values(groupedItemsMap);
}

export function applyFunctionItems(
	groupedItems: (Section | Room)[][],
	applyRules: ApplyRule[],
	id: string
): Record<string, any>[][] {
	console.log("!!! in applyFunctionItems");
	if (!groupItems) {
		throw new InsightError("group key error");
	}

	const results: any[] = []; // To store the results of the calculations

	// console.log("> before for loop, groupedItems: %o", groupedItems.length);
	// console.log("> applyRules: %o", applyRules);
	for (const group of groupedItems) {
		// console.log("!!! group: %o", group);
		const resultItem: any = {}; // To hold the result for the current group

		applyRules.forEach((rule) => {
			const { applyKey, applyToken, key } = rule;

			const idOnly = key.split("_")[0];
			if (idOnly !== id) {
				throw new InsightError("id does not match in APPLY");
			}
			const keyOnly = key.split("_")[1];
			// console.log("!!! key: %o", keyOnly);
			if (applyToken !== "COUNT" && !mkeyFlag(keyOnly)) {
				throw new InsightError("Invalid apply key");
			}
			// console.log("!!! key: %o", keyOnly);

			// Extract values from the group based on the key
			try {
				//!!! just try-catch or check if key is valid?
				const values = group.map((item) => (item as any)[keyOnly]);
				useApply(resultItem, applyKey, applyToken, values);
			} catch (error) {
				throw new InsightError("Invalid apply key in APPLY");
			}
		});
		// console.log("!!! resultItem: %o", resultItem);
		results.push(resultItem); // Add the result item to results array
	}
	console.log("---------------------------------");

	return results;
}

export function combine2(
	groups: string[],
	groupedItems: Item[][],
	appliedItems: Record<string, any>[][]
): Record<string, any>[][] {
	console.log("!!! in combine2");
	// console.log("> groups: %o", groups); // [ 'rooms_shortname', [length]: 1 ]
	// console.log("> groupedItems: %o", groupedItems); // [ [Room{}], [Room{}, Room{}] ]
	// console.log("> appliedItems: %o", appliedItems); // [ {maxSeats: 442}, {maxSeats: 350}]

	const combinedItems: Record<string, any>[][] = [];
	// [ [{"rooms_shortname": "abc"}, {"maxSeats": 442}],
	//   [{"rooms_shortname": "sdf"}, {"maxSeats": 350}] ]
	let i = 0;
	for (const item in groupedItems) {
		// each row
		let combined = [];
		for (const group in groups) {
			const key = groups[group].split("_")[1];
			// console.log("!!! key: %o", key);
			combined.push({ [groups[group]]: groupedItems[i][0].getField(key) });
		}
		combined.push(appliedItems[i]);
		combinedItems[i] = combined;
		i++;
	}
	console.log("---------------------------------");
	// console.log("> combinedItems: %o", combinedItems);
	return combinedItems;
}

export function combine(groupedItems: any, applyItems: any): any {
	for (const [i, applyItem] of applyItems.entries()) {
		groupedItems[i].push(applyItem);
	}
	return groupedItems;
}

export function columnsIncludesAllKeys(columns: String[], keys: String[]): boolean {
	for (const key of keys) {
		if (!columns.includes(key)) {
			return false;
		}
	}
	return true;
}

export function sortResults(items: Item[], sort: Sort, columns: String[]): Item[] {
	// check if order is in columns, if not throw error
	console.log("!!! order: %o", sort);
	console.log("!!! columns: %o", columns);
	// if ((sort.anyKey && !columns.includes(sort.anyKey))) {
	// 	throw new InsightError("ORDER key must be in COLUMNS");
	// } else if (!columnsIncludesAllKeys(columns, sort.keys as string[])){
	// 	throw new InsightError("ORDER keys must be in COLUMNS");
	// }
	let order;
	if (sort.anyKey) {
		order = sort.anyKey;
	} else {
		order = { dir: sort?.dir, keys: sort?.keys };
	}
	if (typeof order === "string") {
		if (!columns.includes(order)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
		console.log("!!! items: %o", items);
		// if order is just something like: 'ORDER: ' ANYKEY
		const field: string = order.split("_")[1];
		if (mkeyFlag(field)) {
			items.sort((a, b) => a.getField(field) - b.getField(field));
		} else {
			items.sort((a, b) => a.getField(field).localeCompare(b.getField(field)));
		}
	} else {
		if (!columnsIncludesAllKeys(columns, sort.keys as string[])) {
			throw new InsightError("ORDER keys must be in COLUMNS");
		}
		console.log("!!! in else block");
		// if order is something like: 'ORDER: { dir:'  DIRECTION ', keys: [ ' ANYKEY_LIST '] }'
		const { dir, keys } = order as any;

		if (!Array.isArray(keys)) {
			throw new InsightError("ORDER keys must be an array");
		}
		if (dir !== "DOWN" && dir !== "UP") {
			throw new InsightError('DIR key must be "UP" or "DOWN"');
		}

		items.sort((a, b) => {
			for (const key of keys as string[]) {
				const { aValue, bValue } = { aValue: a.getField(key), bValue: b.getField(key) };

				let comparison = 0;

				if (mkeyFlag(key)) {
					comparison = aValue - bValue; // Numeric comparison
				} else {
					comparison = aValue.localeCompare(bValue); // String comparison
				}

				// If comparison is not equal, return based on direction
				return comparison !== 0 ? (dir === "UP" ? comparison : -comparison) : 0;
			}
			return 0; // If all keys are equal
		});
	}
	return items;
}

export function sortResultsGroup(
	groupAndApply: Record<string, any>[][],
	sort: Sort,
	columns: String[]
): Record<string, any>[][] {
	// check if order is in columns, if not throw error
	console.log("!!! in sortResults");
	// console.log("!!! order: %o", sort);
	// console.log("!!! columns: %o", columns);
	if ((sort.anyKey && !columns.includes(sort.anyKey)) || !columnsIncludesAllKeys(columns, sort.keys as string[])) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}
	let order;
	if (sort.anyKey) {
		order = sort.anyKey;
	} else {
		order = { dir: sort?.dir, keys: sort?.keys };
	}
	if (typeof order === "string") {
		if (Array.isArray(groupAndApply) && groupAndApply.every((item) => item instanceof Item)) {
			// if order is just something like: 'ORDER: ' ANYKEY
			const field: string = order.split("_")[1];
			if (mkeyFlag(field)) {
				groupAndApply.sort((a: any, b: any) => a.getField(field) - b.getField(field));
			} else {
				groupAndApply.sort((a: any, b: any) => a.getField(field).localeCompare(b.getField(field)));
			}
		} else {
			//!!! for transformations
		}
	} else {
		// if order is something like: 'ORDER: { dir:'  DIRECTION ', keys: [ ' ANYKEY_LIST '] }'
		const { dir, keys } = order as any;

		if (!Array.isArray(keys)) {
			throw new InsightError("ORDER keys must be an array");
		}
		if (dir !== "DOWN" && dir !== "UP") {
			throw new InsightError('DIR key must be "UP" or "DOWN"');
		}
		// console.log("!!! group nd apply: %o", groupAndApply);
		// compare items in appliedItems and then sort both groupedItems and appliedItems
		groupAndApply.sort((a: any, b: any) => {
			for (const key of keys as string[]) {
				// console.log("!!! key: %o", key);
				// console.log("!!! a: %o, b: %o", a, b);
				const { aValue, bValue } = { aValue: a[a.length - 1][key], bValue: b[b.length - 1][key] };
				// console.log("!!! aValue: %o, bValue: %o", aValue, bValue);
				let comparison = 0;

				comparison = aValue - bValue;
				// if (mkeyFlag(key)) {
				// 	comparison = aValue - bValue; // Numeric comparison
				// } else {
				// 	comparison = aValue.localeCompare(bValue); // String comparison
				// }

				// If comparison is not equal, return based on direction
				return comparison !== 0 ? (dir === "UP" ? comparison : -comparison) : 0;
			}
			return 0; // If all keys are equal
		});
	}
	console.log("---------------------------------");
	return groupAndApply;
}

export function returnResults(sortedItems: Record<string, any>[][]): InsightResult[] {
	console.log("!!! in returnResults");
	return sortedItems.map((item) => {
		const result: any = {};
		item.forEach((field) => {
			Object.assign(result, field);
		});
		return result;
	});
}

export function selectColumns(items: any, columns: string[]): InsightResult[] {
	// items is a list of list of objects: [Room{}, Room{}, {maxSeats: 100}], []
	console.log("!!! in selectColumns");
	// console.log("> columns: %o", columns); // all order keys in columns

	for (const column of columns) {
		if (column.includes("_")) {
			const columnName = column.split("_")[1]; // e.g. "shortname"
			// if (columnName)
		}
	}

	//!!!
	return items.map((item: any) => {
		const selected: any = {};
		columns.forEach((column) => {
			const columnNameWithoutDatasetID: string = column.split("_")[1];
			if (columnNameWithoutDatasetID in item) {
				selected[column] = item.getField(columnNameWithoutDatasetID);
			}
		});
		return selected;
	});
}

// traverse query to check that the same valid id is used throughout
export function checkIds(query: Query): string {
	//!!! update for new query
	const columnsWithUnderscore = query.OPTIONS.columns.filter((column: string) => column.includes("_"));
	const idStrings = columnsWithUnderscore.map((column: string) => column.split("_")[0]);
	// check if all idStrings are the same
	const uniqueIds = new Set(idStrings);
	if (uniqueIds.size > 1) {
		throw new InsightError("Multiple dataset IDs found in COLUMNS");
	}
	const datasetId = idStrings[0];

	// order key in columns checked in sortResults
	return datasetId; //!!! check that this still works
}
