import { InsightError } from "../../controller/IInsightFacade";
import Item from "../../models/query/Item";
import Sort from "../../models/query/Sort";
import { mkeyFlag } from "./flagHelpers";
import { columnsIncludesAllKeys } from "./groupHelpers";

export function sortResults(items: Item[], sort: Sort, columns: string[]): Item[] {
	// check if order is in columns, if not throw error
	console.log("!!! in sortResults");
	// console.log("!!! order: %o", sort);
	// console.log("!!! columns: %o", columns);
	// if ((sort.anyKey && !columns.includes(sort.anyKey))) {
	// 	throw new InsightError("ORDER key must be in COLUMNS");
	// } else if (!columnsIncludesAllKeys(columns, sort.keys as string[])){
	// 	throw new InsightError("ORDER keys must be in COLUMNS");
	// }
	let order;
	if (sort.anyKey) {
		order = sort.anyKey;
	} else {
		order = { dir: sort?.dir ?? "UP", keys: sort?.keys ?? [] };
	}
	if (typeof order === "string") {
		sortOrderString(order, columns, items);
	} else {
		sortOrderObject(order, columns, items, sort);
	}
	return items;
}

export function sortOrderString(order: string, columns: string[], items: Item[]): any {
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
}

export function sortOrderObject(
	order: { dir: string; keys: string[] },
	columns: string[],
	items: Item[],
	sort: Sort
): any {
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
		// console.log("!!! a: %o, b: %o", a, b);
		for (const key of keys as string[]) {
			const keyOnly = key.split("_")[1];
			// console.log("!!! key: %o", keyOnly);
			const { aValue, bValue } = { aValue: a.getField(keyOnly), bValue: b.getField(keyOnly) };
			// console.log("!!! aValue: %o, bValue: %o", aValue, bValue);
			let comparison = 0;

			if (mkeyFlag(keyOnly)) {
				comparison = aValue - bValue; // Numeric comparison
			} else {
				comparison = aValue.localeCompare(bValue); // String comparison
			}

			// If comparison is not equal, return based on direction
			if (comparison !== 0) {
				return dir === "UP" ? comparison : -comparison;
			}
			// return comparison !== 0 ? (dir === "UP" ? comparison : -comparison) : 0;
		}
		return 0; // If all keys are equal
	});
}

export function sortResultsGroup(
	groupAndApply: Record<string, any>[][],
	sort: Sort,
	columns: string[]
): Record<string, any>[][] {
	// check if order is in columns, if not throw error
	console.log("!!! in sortResultsGroup");
	console.log("> sort: %o", sort);
	// console.log("!!! columns: %o", columns);
	// if ((sort.anyKey && !columns.includes(sort.anyKey)) || !columnsIncludesAllKeys(columns, sort.keys as string[])) {
	// 	throw new InsightError("ORDER key must be in COLUMNS");
	// }
	let order: string | { dir: string; keys: string[] };
	if (sort.anyKey) {
		order = sort.anyKey;
	} else {
		order = { dir: sort?.dir ?? "UP", keys: sort?.keys ?? [] };
	}
	if (typeof order === "string") {
		sortGroupOrderString(order, columns, groupAndApply);
	} else {
		sortGroupOrderObject(order, columns, groupAndApply, sort);
	}
	console.log("---------------------------------");
	return groupAndApply;
}

export function sortGroupOrderString(order: string, columns: string[], groupAndApply: Record<string, any>[][]): any {
	// couud be "abc_avg" or "maxSeats"
	if (!columns.includes(order)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}
	// if order is just something like: 'ORDER: ' ANYKEY
	if (order.includes("_")) {
		const field: string = order.split("_")[1];
		// console.log("!!! field: %o", field);
		if (mkeyFlag(field)) {
			groupAndApply.sort((a: any, b: any) => a.getField(field) - b.getField(field));
		} else {
			groupAndApply.sort((a: any, b: any) => {
				// console.log("Comparing:", a, b);
				const aValue = a.find((obj: any) =>
					Object.prototype.hasOwnProperty.call(obj, "rooms_shortname")
				).rooms_shortname;
				const bValue = b.find((obj: any) =>
					Object.prototype.hasOwnProperty.call(obj, "rooms_shortname")
				).rooms_shortname;
				return aValue.localeCompare(bValue);
			});
		}
	} else {
		const key: string = order;
		groupAndApply.sort((a: any, b: any) => {
			// console.log("Comparing:", a, b);
			// console.log("Order key:", order);
			return a[a.length - 1][key] - b[b.length - 1][key];
		});
	}
}

export function sortGroupOrderObject(
	order: { dir: string; keys: string[] },
	columns: string[],
	groupAndApply: Record<string, any>[][],
	sort: Sort
): any {
	order as { dir: string; keys: string[] };
	if (!columnsIncludesAllKeys(columns, sort.keys as string[])) {
		throw new InsightError("ORDER keys must be in COLUMNS");
	}
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
