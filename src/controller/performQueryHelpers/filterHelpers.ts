import Negation from "../../models/query/Negation";
import Query from "../../models/query/Query";
import Item from "../../models/query/Item";
import { InsightError } from "../IInsightFacade";
import { handleAND, handleOR, handleNOT, handleEQ, handleGT, handleLT, handleIS } from "./handleOperations";

export function filterItems(where: any, items: Item[], id: string): Item[] {
	// If WHERE block is empty, return all items (no filtering)
	// !!! get all items in the dataset
	// console.log("!!! in filterItems");

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

	// console.log("---------------------------------");
	// If no valid operator is found, return all sections (shouldn't happen)
	return items;
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
