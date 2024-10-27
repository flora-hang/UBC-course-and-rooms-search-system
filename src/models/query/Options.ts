import { InsightError } from "../../controller/IInsightFacade";
import { MField } from "./MComparison";
import { SField } from "./SComparison";
import Sort from "./Sort";

export default class Options {
	public columns: string[]; // string could be key or applykey
	public sort?: Sort;

	constructor(columns: string[], sort?: Sort) {
		this.columns = columns;
		if (sort) {
			this.sort = sort;
		}
	}

	public static buildQuery(object: any): Options {
		if (!object.COLUMNS) {
			throw new InsightError("no COLUMNS in OPTIONS");
		}

		const columns = object.COLUMNS;
		if (!Array.isArray(columns) || columns.length === 0) {
			throw new InsightError("Columns must be a non-empty array");
		}
		// check that each column is valid !!!
		for (const column of columns) {
			if (typeof column !== "string") {
				throw new InsightError("Column must be a string");
			}

			if (column.includes("_")) {
				const parts = column.split("_");
				const numParts = 2;
				if (parts.length !== numParts) {
					throw new InsightError("Invalid column format");
				}
				// check that parts[1] is either a mfield or sfield
				if (!(parts[1] in MField) && !(parts[1] in SField)) {
					throw new InsightError("Invalid mfield/sfield in columns");
				}
			} else {
				// check that anykey is valid: is a applykey under APPLY
				// else throw InsightError: Invalid key <column> in COLUMNS 
				// !!!
				// might not check it here
				// maybe check after sorting?
			}
			

			
		}

		if ("ORDER" in object) { //!!!
			// const order = object.ORDER;
			const sort: Sort = Sort.buildQuery(object.ORDER);
			return new Options(columns, sort);
		} else {
			return new Options(columns);
		}
	}
}
