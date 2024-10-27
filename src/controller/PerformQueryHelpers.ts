import Negation from "../models/query/Negation";
import Query from "../models/query/Query";
import Section from "../models/sections/Section";
import Room from "../models/rooms/Room";
import { InsightError, InsightResult } from "./IInsightFacade";

export function filterItems(where: any, items: Section[] | Room[], id: string): (Section | Room)[] {
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
	// console.log("been outside of EQ");
	// Process comparison operators (EQ, GT, LT, IS)
	if (where.mComparator === "EQ") {
		// console.log("been in EQ");
		// console.log("num sections (EQ): %d\n", sections.length);
		return handleEQ(where, items, id);
	}
	// console.log("been outside of GT");
	if (where.mComparator === "GT") {
		// console.log("been in GT");
		return handleGT(where, items, id);
	}
	// console.log("been outside of LT");
	if (where.mComparator === "LT") {
		// console.log("been in LT");
		return handleLT(where, items, id);
	}

	// console.log(" %s\n", where.filter);
	// console.log("been outside of IS");
	if ("skey" in where) {
		// console.log("been in IS");
		return handleIS(where, items, id);
	}

	// If no valid operator is found, return all sections (shouldn't happen)
	return items;
}

function handleAND(conditions: any[], items: Section[] | Room[], id: string): (Section | Room)[] {
	// console.log("handleAND");
	let results = items;

	for (const condition of conditions) {
		results = filterItems(condition, results, id) as Section[] | Room[];
		// console.log("handleAnd: %d\n", results.length);
	}
	// Merge all results (union)
	return results;
}
function handleOR(conditions: any[], items: Section[] | Room[], id: string): (Section | Room)[] {
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
	// console.log("newitems 2: %d\n", ret.length);
	return ret;

}

function handleNOT(condition: any, items: Section[] | Room[], id: string): (Section | Room)[] {
	// console.log("handleNOT: %s\n", condition);
	const filteredItems = filterItems(condition.filter, items, id);
	// Return sections that are NOT in the filtered set
	return items.filter((item) => !filteredItems.includes(item as Section & Room));
}

function handleEQ(condition: any, items: Section[] | Room[], id: string): (Section | Room)[] {
	// console.log("handleEQ");
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	const ret = items.filter((item) => item.getField(field) === condition.value);
	return ret;
}

function handleGT(condition: any, items: Section[] | Room[], id: string): (Section | Room)[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	// console.log("%s\n", field);
	const ID: string = condition.mkey.split("_")[0];
	// console.log("%s\n", ID);
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	// console.log("%d\n", condition.value);
	const ret = items.filter((item) => item.getField(field) > condition.value);
	// console.log("%d\n", ret.length);
	return ret;
}

function handleLT(condition: any, items: Section[] | Room[], id: string): (Section | Room)[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	const ret = items.filter((item) => item.getField(field) < condition.value);
	// console.log("handleLT: %d\n", ret.length);
	return ret;
}

function handleIS(condition: any, items: Section[] | Room[], id: string): (Section | Room)[] {
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
			ret = items.filter((item) => item.getField(field).includes(str));
			return ret;
		} else if (condition.inputString.startsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length);
			checkWildcardAgain(str);
			ret = items.filter((item) => item.getField(field).endsWith(str));
			return ret;
		} else if (condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(0, condition.inputString.length - 1);
			checkWildcardAgain(str);
			ret = items.filter((item) => item.getField(field).startsWith(str));
			return ret;
		} else {
			throw new InsightError("invalid use of wildcard");
		}
	}

	ret = items.filter((item) => item.getField(field) === condition.inputString);
	// console.log("handleIS: %d\n", ret.length);
	return ret;
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

export function sortResults(items: Section[] | Room[], order: String, columns: String[]): Section[] | Room[] {
	// check if order is in columns, if not throw error
	if (!columns.includes(order)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}

	const field: string = order.split("_")[1];
	if (mkeyFlag(field)) {
		items.sort((a, b) => a.getField(field) - b.getField(field));
		// items.sort((a, b) => a.getDept().localeCompare(b.getDept()));
	} else {
		items.sort((a, b) => a.getField(field).localeCompare(b.getField(field)));
	}

	return items;
}

export function selectColumns(items: Section[] | Room[], columns: string[]): InsightResult[] {
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
	const idStrings = query.OPTIONS.columns.map((column: string) => column.split("_")[0]);
	// check if all idStrings are the same
	const uniqueIds = new Set(idStrings);
	if (uniqueIds.size > 1) {
		throw new InsightError("Multiple dataset IDs found in COLUMNS");
	}
	const datasetId = idStrings[0];

	// order key in columns checked in sortResults
	return datasetId;
}
