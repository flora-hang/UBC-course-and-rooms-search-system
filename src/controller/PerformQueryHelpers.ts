import Negation from "../models/query/Negation";
import Query from "../models/query/Query";
import Section from "../models/sections/Section";
import Room from "../models/rooms/Room";
import Item from "../models/query/Item";
import { InsightError, InsightResult } from "./IInsightFacade";
import ApplyRule, { useApply } from "../models/query/ApplyRule";

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
			console.log("!!!!!!!a", field)
			ret = items.filter((item) => item.getField(field).includes(str));
			return ret as any;
		} else if (condition.inputString.startsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length);
			checkWildcardAgain(str);
			console.log("!!!!!!!b", field)
			ret = items.filter((item) => item.getField(field).endsWith(str));
			return ret as any;
		} else if (condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(0, condition.inputString.length - 1);
			checkWildcardAgain(str);
			console.log("!!!!!!!c", field)
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
		default:
			return false;
	}
}

// TODO: this function might cause errors tbh
export function groupItems(items: Item[], groups: String[]): any {
	const groupedItemsMap: Record<string, Item[]> = {};
	items.forEach((item) => {
		const key = groups.map((group) => (item as any)[group.split("_")[1]]).join("_");
		if (!groupedItemsMap[key]) {
			groupedItemsMap[key] = [item];
		} else {
			groupedItemsMap[key].push(item);
		}
	});

	return Object.values(groupedItemsMap);
}

export function applyFunctionItems(groupedItems: (Section | Room)[][], applyRules: ApplyRule[]): (Section | Room)[] {
	if (!groupItems) {
		throw new InsightError("group key error");
	}

	const results: any[] = []; // To store the results of the calculations

	for (const group of groupedItems) {
		const resultItem: any = {}; // To hold the result for the current group

		applyRules.forEach((rule) => {
			const { applyKey, applyToken, key } = rule;

			// Extract values from the group based on the key
			const values = group.map((item) => (item as any)[key]);

			useApply(resultItem, applyKey, applyToken, values);
		});

		results.push(resultItem); // Add the result item to results array
	}

	return results;
}

export function sortResults(items: Item[], order: String, columns: String[]): Item[] {
	// check if order is in columns, if not throw error
	if (!columns.includes(order)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}

	if (typeof order === "string") { // if order is just something like: 'ORDER: ' ANYKEY
		const field: string = order.split("_")[1];
		if (mkeyFlag(field)) {
			items.sort((a, b) => a.getField(field) - b.getField(field));
		} else {
			items.sort((a, b) => a.getField(field).localeCompare(b.getField(field)));
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

export function selectColumns(items: Item[], columns: string[]): InsightResult[] {
	return items.map((item) => {
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
