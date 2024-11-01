import { InsightError } from "../../controller/IInsightFacade";
import Item from "../../models/query/Item";
import Sort from "../../models/query/Sort";
import { mkeyFlag } from "./flagHelpers";
import { columnsIncludesAllKeys } from "./groupHelpers";

export function sortResults(items: Item[], sort: Sort, columns: string[]): Item[] {
	// check if order is in columns, if not throw error
	// console.log("!!! in sortResults");
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
	// console.log("!!! items: %o", items);
	// if order is just something like: 'ORDER: ' ANYKEY
	const field: string = order.split("_")[1];
	if (mkeyFlag(field)) {
		items.sort((a, b) => a.getField(field) - b.getField(field));
	} else {
		items.sort((a, b) => (a.getField(field) > b.getField(field)) ? 1 : -1);
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
	// console.log("!!! in else block");
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
				comparison = aValue > bValue ? 1 : -1; // String comparison
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
	// console.log("!!! in sortResultsGroup");
	// console.log("> sort: %o", sort);
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
	// console.log("---------------------------------");
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
			groupAndApply.sort((a: Record<string, any>[], b: Record<string, any>[]) => {
				let aValue = 0;
				let bValue = 0;
				for (const obj of a) {
					const key = Object.keys(obj)[0];
					const keyOnly = key.split("_")[1];
					if (keyOnly === field) {
						aValue = obj[key];
					}
				}
				for (const obj of b) {
					const key = Object.keys(obj)[0];
					const keyOnly = key.split("_")[1];
					if (keyOnly === field) {
						bValue = obj[key];
					}
				}
				return aValue - bValue;
			});
		} else {
			groupAndApply.sort((a: any, b: any) => { 
				// console.log("Comparing:", a, b);
				let aValue = "";
				let bValue = "";
				for (const obj of a) {
					const key = Object.keys(obj)[0];
					const keyOnly = key.split("_")[1];
					if (keyOnly === field) {
						aValue = obj[key];
					}
				}
				for (const obj of b) {
					const key = Object.keys(obj)[0];
					const keyOnly = key.split("_")[1];
					if (keyOnly === field) {
						bValue = obj[key];
					}
				}
				// console.log("!!! aValue: %o, bValue: %o", aValue, bValue);
				// console.log("!!! aValue > bValue: %o", aValue > bValue);

				return(aValue > bValue) ? 1 : -1;
			});
		}
	} else {
		const key: string = order;
		groupAndApply.sort((a: any, b: any) => {
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
	// order is something like: 'ORDER: { dir:'  DIRECTION ', keys: [ ' ANYKEY_LIST '] }'
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

			let comparison = 0;
			// new stuff:
			comparison = compareValues(key, a, b);
			// console.log("!!! comparison: %o", comparison);

			// If comparison is not zero, return the result
			if (comparison !== 0) {
				return dir === "UP" ? comparison : -comparison;
			}
		}
		return 0; // If all keys are equal
	});
}

function compareValues(key: string, a: any, b: any): number {
	if (key.includes("_")) {
		const field: string = key.split("_")[1];
		if (mkeyFlag(field)) {
			let aValue = 0;
			let bValue = 0;
			for (const obj of a) {
				const key1 = Object.keys(obj)[0]; //key1 to fix lint error
				const keyOnly = key1.split("_")[1];
				if (keyOnly === field) {
					aValue = obj[key1];
				}
			}
			for (const obj of b) {
				const key2 = Object.keys(obj)[0];
				const keyOnly = key2.split("_")[1];
				if (keyOnly === field) {
					bValue = obj[key2];
				}
			}
			return aValue - bValue;
		} else {
			let aValue = "";
			let bValue = "";
			for (const obj of a) {
				const key1 = Object.keys(obj)[0]; //key1 to fix lint error
				const keyOnly = key1.split("_")[1];
				if (keyOnly === field) {
					aValue = obj[key1];
				}
			}
			for (const obj of b) {
				const key2 = Object.keys(obj)[0];
				const keyOnly = key2.split("_")[1];
				if (keyOnly === field) {
					bValue = obj[key2];
				}
			}
			return aValue > bValue ? 1 : -1;
		}
	} else {
		// doesn't include "_"
		const { aValue, bValue } = { aValue: a[a.length - 1][key], bValue: b[b.length - 1][key] };
		return aValue - bValue;
		// console.log("!!! aValue - bValue: %o", aValue - bValue);
	}
	// console.log("!!! comparison: %o", comparison);
	// return comparison;
}

