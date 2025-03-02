import { InsightError } from "../../controller/IInsightFacade";
import IFilter from "./IFilter";

export enum SField {
	dept = "dept",
	id = "id",
	instructor = "instructor",
	title = "title",
	uuid = "uuid",
	// new fields for rooms
	fullname = "fullname",
	shortname = "shortname",
	number = "number",
	name = "name",
	address = "address",
	type = "type",
	furniture = "furniture",
	href = "href",
}

export default class SComparison implements IFilter {
	public skey: string; // skey ::= '"' idstring '_' sfield '"'
	public inputString: string;

	constructor(skey: string, inputString: string) {
		this.skey = skey;
		this.inputString = inputString;
	}

	public buildQuery(object: any): IFilter {
		throw new Error("buildQuery not implemented.", object);
	}

	public static buildQuery(object: any): IFilter {
		const key = Object.keys(object)[0]; // returns 'IS'
		if (key !== "IS") {
			throw new Error("Invalid logic comparison");
		}
		if (!object[key] || Object.keys(object[key]).length === 0) {
			throw new InsightError("S comparison must have a mkey and value");
		}
		if (Object.keys(object[key]).length > 1) {
			throw new InsightError("Invalid SComparison: more than one key");
		}

		const skey = Object.keys(object[key])[0];
		const parts = skey.split("_");
		const numParts = 2;
		if (parts.length !== numParts) {
			throw new InsightError("Invalid skey format");
		}

		// check that mfield is valid
		if (!(parts[1] in SField)) {
			throw new InsightError("Invalid sfield");
		}
		const inputString = object[key][skey];
		if (typeof inputString !== "string") {
			throw new InsightError("inputString must be a string");
		}

		const two = 2;
		if (inputString.length > two && inputString.slice(1, -1).includes("*")) {
			throw new InsightError("invalid inputString with * in the middle");
		}

		return new SComparison(skey, inputString);
	}
}
