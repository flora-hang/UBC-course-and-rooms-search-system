import { InsightResult } from "../../controller/IInsightFacade";

export function returnResults(sortedItems: Record<string, any>[][], columns: string[]): InsightResult[] {
	// console.log("!!! in returnResults");
	return sortedItems.map((item) => {
		const result: any = {};
		// item.forEach((field) => {
		// 	Object.assign(result, field);
		// });
		item.forEach((field) => {
			extractFields(field, columns, result);
		});
		return result;
	});
}

function extractFields(field: Record<string, any>, columns: string[], result: Record<string, any>): void {
    Object.keys(field).forEach((key) => {
        if (columns.includes(key)) {
            result[key] = field[key];
        }
    });
}

export function selectColumns(items: any, columns: string[]): InsightResult[] {
	// items is a list of list of objects: [Room{}, Room{}, {maxSeats: 100}], []
	// console.log("!!! in selectColumns");
	// console.log("> columns: %o", columns); // all order keys in columns

	// for (const column of columns) {
	// 	if (column.includes("_")) {
	// 		const columnName = column.split("_")[1]; // e.g. "shortname"
	// 		// if (columnName)
	// 	}
	// }

	//!!!
	return items.map((item: any) => {
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
