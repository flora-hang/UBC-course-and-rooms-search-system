import Decimal from "decimal.js";
import { InsightError } from "../../controller/IInsightFacade";

const ROUNDING_PRECISION = 2;

export enum ApplyToken {
	MAX = "MAX",
	MIN = "MIN",
	AVG = "AVG",
	COUNT = "COUNT",
	SUM = "SUM",
}

export default class ApplyRule {
	public applyKey: string; // One or more of any character, except underscore.
	public applyToken: ApplyToken;
	public key: string; // KEY ::= mkey | skey // (e.g. rooms_seats)

	constructor(applyKey: string, applyToken: ApplyToken, key: string) {
		this.applyKey = applyKey;
		this.applyToken = applyToken;
		this.key = key;
	}

	public static buildQuery(object: any): ApplyRule {
		const applyKey = Object.keys(object)[0];
		const nestedObject = object[applyKey];
		const applyToken = Object.keys(nestedObject)[0] as ApplyToken;
		const key = nestedObject[applyToken];

		return new ApplyRule(applyKey, applyToken, key);
	}
}

export function useApply(resultItem: any, applyKey: string, applyToken: ApplyToken, values: any[]): void {
	switch (applyToken) {
		case "MAX": {
			resultItem[applyKey] = Math.max(...values); // Get the maximum value
			break;
		}
		case "MIN": {
			resultItem[applyKey] = Math.min(...values); // Get the minimum value
			break;
		}
		case "AVG": {
			const total = values.reduce((sum, val) => Decimal.add(sum, new Decimal(val)), new Decimal(0));
			const avg = total.toNumber() / values.length;
			resultItem[applyKey] = Number(avg.toFixed(ROUNDING_PRECISION)); // Round to two decimal places
			break;
		}
		case "SUM": {
			const sum = values.reduce((acc, val) => acc + val, 0);
			resultItem[applyKey] = Number(sum.toFixed(ROUNDING_PRECISION)); // Round to two decimal places
			break;
		}
		case "COUNT": {
			const uniqueCount = new Set(values).size; // Count unique occurrences
			resultItem[applyKey] = uniqueCount;
			break;
		}
		default:
			throw new InsightError(`Unsupported applyToken: ${applyToken}`);
	}
}
