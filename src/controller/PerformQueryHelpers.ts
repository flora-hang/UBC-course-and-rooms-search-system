import Negation from "../models/query/Negation";
import Query from "../models/query/Query";
import Section from "../models/Section";
import { InsightError, InsightResult } from "./IInsightFacade";

export function filterSections(where: any, sections: Section[], id: string): Section[] {
	// If WHERE block is empty, return all sections (no filtering)
	// !!! get all sections in the dataset
	console.log("been in filteredSections");
	if (Object.keys(where).length === 0) {
		return sections;
	}
	// console.log("%d\n", sections.length);
	// Process logical operators
	if (where.filter.logic === "AND") {
		console.log("num sections (AND): %d\n", sections.length);
		console.log("%s\n", where.filter.filters);

		return handleAND(where.filter.filters, sections, id);
	}
	if (where.filter.logic === "OR") {
		console.log("num sections (OR): %d\n", sections.length);
		console.log("%s\n", where.filter.filters);
		// console.log("num sections (OR): %d\n", sections.length);
		return handleOR(where.filter.filters, sections, id);
	}
	if (where.filter instanceof Negation) {
		// console.log("num sections (NOT): %d\n", sections.length);
		return handleNOT(where.filter, sections, id);
	}

	// Process comparison operators (EQ, GT, LT, IS)
	if (where.filter.mComparator === "EQ") {
		console.log("num sections (EQ): %d\n", sections.length);
		return handleEQ(where.filter, sections, id);
	}

	if (where.filter.mComparator === "GT") {
		return handleGT(where.filter, sections, id);
	}

	if (where.filter.mComparator === "LT") {
		return handleLT(where.filter, sections, id);
	}
	// console.log(" %s\n", where.filter);
	if ("skey" in where.filter) {
		return handleIS(where.filter, sections, id);
	}

	// If no valid operator is found, return all sections (shouldn't happen)
	return sections;
}

function handleAND(conditions: any[], sections: Section[], id: string): Section[] {
	let results: Section[] = sections;
	for (const condition of conditions) {
		results = filterSections(condition, results, id);
	}
	// Merge all results (union)
	return results;
}
function handleOR(conditions: any[], sections: Section[], id: string): Section[] {
	const results = conditions.map((condition) => filterSections(condition, sections, id));
	// Merge all results (union)
	return results.flat();
}

function handleNOT(condition: any, sections: Section[], id: string): Section[] {
	console.log("%s\n", condition);
	const filteredSections = filterSections(condition, sections, id);
	// Return sections that are NOT in the filtered set
	return sections.filter((section) => !filteredSections.includes(section));
}

function handleEQ(condition: any, sections: Section[], id: string): Section[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	return sections.filter((section) => section.getField(field) === condition.value);
}

function handleGT(condition: any, sections: Section[], id: string): Section[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	console.log("%s\n", field);
	const ID: string = condition.mkey.split("_")[0];
	console.log("%s\n", ID);
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	console.log("%d\n", condition.value);
	const ret = sections.filter((section) => section.getField(field) > condition.value);
	console.log("%d\n", ret.length);
	return ret;
}

function handleLT(condition: any, sections: Section[], id: string): Section[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	return sections.filter((section) => section.getField(field) < condition.value);
}

function handleIS(condition: any, sections: Section[], id: string): Section[] {
	const field: string = condition.skey.split("_")[1]; // e.g. "avg"
	console.log("%s\n", field);
	const ID: string = condition.skey.split("_")[0];
	console.log("%s\n", ID);
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	console.log("%s\n", condition.inputString);
	let ret;
	if (condition.inputString.includes("*")) {
		if (condition.inputString.startsWith("*") && condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length - 1);
			console.log("%s\n", str);
			ret = sections.filter((section) => section.getField(field).includes(str));
		} else if (condition.inputString.startsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length);
			console.log("%s\n", str);
			ret = sections.filter((section) => section.getField(field).endsWith(str));
		} else if (condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(0, condition.inputString.length - 1);
			console.log("%s\n", str);
			ret = sections.filter((section) => section.getField(field).startsWith(str));
		} else {
			throw new InsightError("invalid use of wildcard");
		}
	}
	// let string = "geob";
	// let bool = string.endsWith("")
	ret = sections.filter((section) => section.getField(field) === condition.inputString);
	console.log("%d\n", ret.length);
	return ret;
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

// function skeyFlag(field: string): boolean {
// 	switch (field) {
// 		case "dept":
// 			return true;
// 		case "id":
// 			return true;
// 		case "instructor":
// 			return true;
// 		case "title":
// 			return true;
// 		case "uuid":
// 			return true;
// 		default:
// 			return false;
// 	}
// }

export function sortResults(sections: Section[], order: String, columns: String[]): Section[] {
	// check if order is in columns, if not throw error
	if (!columns.includes(order)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}

	const field: string = order.split("_")[1];
	if (mkeyFlag(field)) {
		sections.sort((a, b) => a.getField(field) - b.getField(field));
	} else {
		sections.sort((a, b) => a.getField(field).localeCompare(b.getField(field)));
	}

	return sections;
}

export function selectColumns(sections: Section[], columns: string[]): InsightResult[] {
	columns = columns.map((column) => column.split("_")[1]);

	return sections.map((section) => {
		const selected: any = {};
		columns.forEach((column) => {
			if (column in section) {
				selected[column] = section.getField(column);
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
	// if (query.OPTIONS.order && query.OPTIONS.order.split("_")[0] !== datasetId) {
	// 	throw new InsightError("Multiple dataset IDs found in ORDER");
	// }
	// query.WHERE.checkId(datasetId);
	return datasetId;
}
