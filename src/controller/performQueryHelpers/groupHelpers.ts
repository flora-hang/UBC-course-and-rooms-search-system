import { InsightError } from "../../controller/IInsightFacade";
import Item from "../../models/query/Item";

export function groupItems(items: Item[], groups: String[], id: string): any {
	// console.log("!!! in groupItems"); // items = filteredItems
	// console.log("> groups: %o", groups);
	// console.log("> items: %o", items);
	const groupedItemsMap: Record<string, Item[]> = {}; // Item[] = groupedItems

	items.forEach((item) => {
		// const key = groups.map((group) => (item as any)[group.split("_")[1]]).join("_");

		// Generate the key by accessing the properties specified in the groups array
		const key = groups
			.map((grpStr) => {
				const groupId = grpStr.split("_")[0];
				if (groupId !== id) {
					throw new InsightError("id does not match in GROUP");
				}
				if (!grpStr.includes("_")) {
					throw new InsightError("Invalid key in GROUP");
				}
				const property = grpStr.split("_")[1];
				// console.log("!!! property: %o", property);
				try {
					const value = item.getField(property);
					return value;
				} catch (_error) {
					throw new InsightError("Invalid key in GROUP");
				}
			})
			.join("_");

		if (!groupedItemsMap[key]) {
			groupedItemsMap[key] = [item];
		} else {
			groupedItemsMap[key].push(item);
		}
	});
	// console.log("---------------------------------");
	// console.log("in helper:", groupedItemsMap.length);
	return Object.values(groupedItemsMap);
}

export function columnsIncludesAllKeys(columns: String[], keys: String[]): boolean {
	for (const key of keys) {
		if (!columns.includes(key)) {
			return false;
		}
	}
	return true;
}

export function combine2(
	groups: string[],
	groupedItems: Item[][],
	appliedItems: Record<string, any>[][]
): Record<string, any>[][] {
	// console.log("!!! in combine2");
	// console.log("> groups: %o", groups); // [ 'rooms_shortname', [length]: 1 ]
	// console.log("> groupedItems: %o", groupedItems); // [ [Room{}], [Room{}, Room{}] ]
	// console.log("> appliedItems: %o", appliedItems); // [ {maxSeats: 442}, {maxSeats: 350}]

	const combinedItems: Record<string, any>[][] = [];
	// [ [{"rooms_shortname": "abc"}, {"maxSeats": 442}],
	//   [{"rooms_shortname": "sdf"}, {"maxSeats": 350}] ]

	for (let i = 0; i < groupedItems.length; i++) {
		// each row
		const combined = [];
		for (const group of groups) {
			const key = group.split("_")[1];
			// console.log("!!! key: %o", key);
			combined.push({ [group]: groupedItems[i][0].getField(key) });
		}
		combined.push(appliedItems[i]);
		combinedItems[i] = combined;
	}

	// console.log("---------------------------------");
	// console.log("> combinedItems: %o", combinedItems);
	return combinedItems;
}

export function combine(groupedItems: any, applyItems: any): any {
	for (const [i, applyItem] of applyItems.entries()) {
		groupedItems[i].push(applyItem);
	}
	return groupedItems;
}
