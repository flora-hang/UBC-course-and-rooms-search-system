import Negation from "../models/query/Negation";
import Query from "../models/query/Query";
import Section from "../models/Section";
import { InsightError, InsightResult } from "./IInsightFacade";

export function filterSections(where: any, sections: Section[], id: string): Section[] {
	// If WHERE block is empty, return all sections (no filtering)
	// !!! get all sections in the dataset
	console.log("been in filteredSections");
	console.log("%s\n", where);
	if (where.filter === undefined) {
		return sections;
	}

	// console.log("%d\n", sections.length);
	// Process logical operators
	if (where.filter.logic === "AND") {
		// console.log("num sections (AND): %d\n", sections.length);
		console.log("%s\n", where.filter.filters);

		console.log("been in AND");
		return handleAND(where.filter.filters, sections, id);
	}
	if (where.filter.logic === "OR") {
		// console.log("num sections (OR): %d\n", sections.length);
		// console.log("%s\n", where.filter.filters);
		// console.log("been in OR");
		// console.log("num sections (OR): %d\n", sections.length);
		return handleOR(where.filter.filters, sections, id);
	}
	if (where.filter instanceof Negation) {
		// console.log("been in NOT");
		// console.log("num sections (NOT): %d\n", sections.length);
		return handleNOT(where.filter, sections, id);
	}

	// Process comparison operators (EQ, GT, LT, IS)
	if (where.filter.mComparator === "EQ") {
		// console.log("been in EQ");
		// console.log("num sections (EQ): %d\n", sections.length);
		return handleEQ(where.filter, sections, id);
	}

	if (where.filter.mComparator === "GT") {
		console.log("been in GT");
		return handleGT(where.filter, sections, id);
	}

	if (where.filter.mComparator === "LT") {
		console.log("been in LT");
		return handleLT(where.filter, sections, id);
	}

	// console.log(" %s\n", where.filter);
	if ("skey" in where.filter) {
		// console.log("been in IS");
		return handleIS(where.filter, sections, id);
	}

	// If no valid operator is found, return all sections (shouldn't happen)
	return sections;
}

function handleAND(conditions: any[], sections: Section[], id: string): Section[] {
	let results: Section[] = sections;
	console.log("%s\n", conditions);
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

	const ID: string = condition.skey.split("_")[0];

	if (ID !== id) {
		throw new InsightError("id does not match");
	}

	let ret;
	if (condition.inputString.includes("*")) {
		if (condition.inputString.startsWith("*") && condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length - 1);
			ret = sections.filter((section) => section.getField(field).includes(str));
			return ret;
		} else if (condition.inputString.startsWith("*")) {
			const str = condition.inputString.substring(1, condition.inputString.length);
			ret = sections.filter((section) => section.getField(field).endsWith(str));
			return ret;
		} else if (condition.inputString.endsWith("*")) {
			const str = condition.inputString.substring(0, condition.inputString.length - 1);
			ret = sections.filter((section) => section.getField(field).startsWith(str));
			return ret;
		} else {
			throw new InsightError("invalid use of wildcard");
		}
	}

	ret = sections.filter((section) => section.getField(field) === condition.inputString);
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
	return sections.map((section) => {
		const selected: any = {};
		columns.forEach((column) => {
			const columnNameWithoutDatasetID: string = column.split("_")[1];
			if (columnNameWithoutDatasetID in section) {
				selected[column] = section.getField(columnNameWithoutDatasetID);
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
