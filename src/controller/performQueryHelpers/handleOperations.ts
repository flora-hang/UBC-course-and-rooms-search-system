import Item from "../../models/query/Item";
import { filterItems } from "./filterHelpers";
import { InsightError } from "../../controller/IInsightFacade";

export function handleAND(conditions: any[], items: Item[], id: string): Item[] {
	console.log("--- handleAND ---");
	let results = items;

	for (const condition of conditions) {
		results = filterItems(condition, results, id) as Item[];
		// console.log("handleAnd: %d\n", results.length);
	}
	// Merge all results (union)
	console.log("handleAND: %d\n", results.length);
	return results;
}

export function handleOR(conditions: any[], items: Item[], id: string): Item[] {
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

export function handleNOT(condition: any, items: Item[], id: string): Item[] {
	const filteredItems = filterItems(condition.filter, items, id);
	return items.filter((item) => !filteredItems.includes(item));
}

export function handleEQ(condition: any, items: Item[], id: string): any {
	// console.log("handleEQ");
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	const ret = items.filter((item) => item.getField(field) === condition.value);
	return ret as any;
}

export function handleGT(condition: any, items: Item[], id: string): any {
	console.log("--- handleGT ---");
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"

	const ID: string = condition.mkey.split("_")[0];

	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	// console.log("%d\n", condition.value);
	// console.log(field);
	const ret = items.filter((item) => item.getField(field) > condition.value);
	console.log("handleGT: %d\n", ret.length);
	return ret as any;
}

export function handleLT(condition: any, items: Item[], id: string): any {
	const field: string = condition.mkey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.mkey.split("_")[0];
	if (ID !== id) {
		throw new InsightError("id does not match");
	}
	const ret = items.filter((item) => item.getField(field) < condition.value);
	// console.log("handleLT: %d\n", ret.length);
	return ret as any;
}

export function handleIS(condition: any, items: Item[], id: string): any {
	// console.log("--- handleIS ---");
	const field: string = condition.skey.split("_")[1]; // e.g. "avg"
	const ID: string = condition.skey.split("_")[0];

	if (ID !== id) {
		throw new InsightError("id does not match");
	}

	if (condition.inputString === "*") {
		return items;
	} else if (condition.inputString.includes("*")) {
		return handleISHelper(condition, items, field);
	}

	const ret = items.filter((item) => item.getField(field) === condition.inputString);
	console.log("handleIS: %d\n", ret.length);
	return ret as any;
}

function handleISHelper(condition: any, items: Item[], field: string): any {
	let ret;
	if (condition.inputString.startsWith("*") && condition.inputString.endsWith("*")) {
		const str = condition.inputString.substring(1, condition.inputString.length - 1);
		checkWildcardAgain(str);
		// console.log("!!!!!!!a", field);
		ret = items.filter((item) => item.getField(field).includes(str));
		return ret as any;
	} else if (condition.inputString.startsWith("*")) {
		const str = condition.inputString.substring(1, condition.inputString.length);
		checkWildcardAgain(str);
		// console.log("!!!!!!!b", field);
		ret = items.filter((item) => item.getField(field).endsWith(str));
		return ret as any;
	} else if (condition.inputString.endsWith("*")) {
		const str = condition.inputString.substring(0, condition.inputString.length - 1);
		checkWildcardAgain(str);
		// console.log("!!!!!!!c", field);
		ret = items.filter((item) => item.getField(field).startsWith(str));
		return ret as any;
	} else {
		throw new InsightError("invalid use of wildcard");
	}
}

function checkWildcardAgain(str: string): void {
	// if (str.includes("*")) {
	// 	throw new InsightError("* in the middle");
	// }
	const two = 2;
	if (str.length > two && str.slice(1, -1).includes("*")) {
		throw new InsightError("invalid inputString with * in the middle");
	}
}
