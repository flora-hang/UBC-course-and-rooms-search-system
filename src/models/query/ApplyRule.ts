import Decimal from "decimal.js";
import Section from "../sections/Section";
import Room from "../rooms/Room";
import { InsightError } from "../../controller/IInsightFacade";

export enum ApplyToken {
    MAX = "MAX",
    MIN = "MIN",
    AVG = "AVG",
    COUNT = "COUNT",
    SUM = "SUM"
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
}

export function useApply(
	applyToken: ApplyToken,
	key: string,
	groupItem: (Section | Room)[]
): number {
	const field: string = key.split("_")[1];
	switch (applyToken) {
		case "MAX":
			return Math.max(...groupItem.map(item => item.getField(field)));
		case "MIN":
			return Math.min(...groupItem.map(item => item.getField(field)));
		case "AVG":
			return groupItem.map(item => item.getField(field)).reduce((sum, curr) => sum + curr, 0) / groupItem.length;
		case "COUNT":
			return groupItem.reduce(count => count++, 0);
		case "SUM":
			return groupItem.map(item => item.getField(field)).reduce((sum, curr) => sum + curr, 0);
		default:
			throw new InsightError("Invalid transformation operator");
	}
}
