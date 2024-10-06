import Section from "../models/Section";
import {
	InsightError,
	InsightResult,
} from "./IInsightFacade";

export function filterSections(where: any, sections: Section[]): Section[] {
	// If WHERE block is empty, return all sections (no filtering)
	// !!! get all sections in the dataset
	if (Object.keys(where).length === 0) {
		return sections;
	}

	// Process logical operators
	if (where.AND) {
		return handleAND(where.AND, sections);
	}
	if (where.OR) {
		return handleOR(where.OR, sections);
	}
	if (where.NOT) {
		return handleNOT(where.NOT, sections);
	}

	// Process comparison operators (EQ, GT, LT, IS)
	if (where.EQ) {
		return handleEQ(where.EQ, sections);
	}
	if (where.GT) {
		return handleGT(where.GT, sections);
	}
	if (where.LT) {
		return handleLT(where.LT, sections);
	}
	if (where.IS) {
		return handleIS(where.IS, sections);
	}

	// If no valid operator is found, return all sections (shouldn't happen)
	return sections;
}

function handleAND(conditions: any[], sections: Section[]): Section[] {
	return conditions.reduce((acc, condition) => {
		return filterSections(condition, acc);
	}, sections); // Apply each condition on the filtered result
}

function handleOR(conditions: any[], sections: Section[]): Section[] {
	const results = conditions.map((condition) => filterSections(condition, sections));
	// Merge all results (union)
	return results.flat();
}

function handleNOT(condition: any, sections: Section[]): Section[] {
	const filteredSections = filterSections(condition, sections);
	// Return sections that are NOT in the filtered set
	return sections.filter((section) => !filteredSections.includes(section));
}

function handleEQ(condition: any, sections: Section[]): Section[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	// const [field, value] = Object.entries(condition)[0];
	return sections.filter((section) => section.getField(field) === condition.value);
}

function handleGT(condition: any, sections: Section[]): Section[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	// const [field, value] = Object.entries(condition)[0];
	return sections.filter((section) => section.getField(field) > condition.value);
}

function handleLT(condition: any, sections: Section[]): Section[] {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	// const [field, value] = Object.entries(condition)[0];
	return sections.filter((section) => section.getField(field) < condition.value);
}

function handleIS(condition: any, sections: Section[]): Section[] {
	const field: string = condition.skey.split("_")[1]; // e.g. "avg"
	// const [field, value] = Object.entries(condition)[0];
	if (condition.inputString.includes("*")) {
		if (condition.inputString.startsWith("*") && condition.inputString.endsWith("*")) {
			return sections.filter((section) => section.getField(field).constains(condition.inputString));
		} else if (condition.inputString.startsWith("*")) {
			return sections.filter((section) => section.getField(field).endsWith(condition.inputString));
		} else if (condition.inputString.endsWith("*")) {
			return sections.filter((section) => section.getField(field).startsWith(condition.inputString));
		} else {
			throw new InsightError("invalid use of wildcard");
		}
	}
	return sections.filter((section) => section.getField(field) === condition.value);
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

	return sections.map(section => {
        const selected: any = {};
        columns.forEach(column => {
            if (column in section) {
                selected[column] = section.getField(column);
            }
        });
        return selected;
    });
}
