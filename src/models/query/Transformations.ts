import { InsightError } from "../../controller/IInsightFacade";
import ApplyRule from "./ApplyRule";

// TRANSFORMATIONS ::= 'TRANSFORMATIONS: {' GROUP ', ' APPLY '}'
export default class Transformations {
	public group: string[];
	public apply: ApplyRule[]; // can be empty

	constructor(group: string[], apply: ApplyRule[]) {
		this.group = group;
		this.apply = apply;
	}

	public static buildQuery(object: any): Transformations {
		if (!object.GROUP) {
			throw new InsightError("Transformations must have a GROUP block");
		}
		if (!object.APPLY) {
			throw new InsightError("Transformations must have an APPLY block");
		}
		const group: string[] = object.GROUP;
		if (!Array.isArray(group) || group.length === 0) {
			throw new InsightError("GROUP must be a non-empty array");
		}
		const apply: ApplyRule[] = [];
		for (const applyRule of object.APPLY) {
			apply.push(ApplyRule.buildQuery(applyRule));
		}
		return new Transformations(group, apply);
	}
}
