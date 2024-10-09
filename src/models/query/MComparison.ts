import { InsightError } from "../../controller/IInsightFacade";
import IFilter from "./IFilter";

export enum MComparator {
	LT = "LT",
	GT = "GT",
	EQ = "EQ",
}

export enum MField {
	avg = "avg",
	pass = "pass",
	fail = "fail",
	audit = "audit",
	year = "year",
}

export default class MComparison implements IFilter {
	public mComparator: MComparator;
	public mkey: string; // mkey ::= '"' idstring '_' mfield '"'
	public value: number;

	constructor(mComparator: MComparator, mkey: string, value: number) {
		this.mComparator = mComparator;
		this.mkey = mkey;
		this.value = value;
	}

	// public checkId(id: string): void {
	//     if (this.mkey.split('_')[0] !== id) {
	//         throw new InsightError('Cannot query from multiple datasets');
	//     }
	// }

	public buildQuery(object: any): IFilter {
		throw new Error("buildQuery not implemented.", object);
	}

	public static buildQuery(object: any): IFilter {
		// console.log("> MComparison.buildQuery(): ", object);
		const key = Object.keys(object)[0]; // returns 'GT' | 'LT' | 'EQ'
		if (key !== MComparator.LT && key !== MComparator.GT && key !== MComparator.EQ) {
			throw new Error("Invalid M comparison");
		}
		const mComparator = key as MComparator;

		if (!object[key] || Object.keys(object[key]).length === 0) {
			throw new InsightError("M comparison must have a mkey and value");
		}
		if (Object.keys(object[key]).length > 1) {
			throw new InsightError("Invalid MComparison: more than one key");
		}

		const mkey = Object.keys(object[key])[0]; // e.g. returns "sections_avg"
		const parts = mkey.split("_");
		const numParts = 2;
		if (parts.length !== numParts) {
			throw new InsightError("Invalid mkey format");
		}

		// check that mfield is valid
		if (!(parts[1] in MField)) {
			throw new InsightError("Invalid mfield");
		}
		const value = object[key][mkey];
		// check that value is a number
		if (typeof value !== "number") {
			throw new InsightError("Value must be a number");
		}

		return new MComparison(mComparator, mkey, value);
	}
}
