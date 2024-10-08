import { InsightError } from "../../controller/IInsightFacade";
import IFilter from "./IFilter";

export enum Logic {
	AND = "AND",
	OR = "OR",
}

export default class LogicComparison implements IFilter {
	public logic: Logic;
	public filters: IFilter[];

	constructor(logic: Logic, filters: IFilter[]) {
		this.logic = logic;
		this.filters = filters;
	}

	// public checkId(id: string): void {
	//     for (const filter of this.filters) {
	//         filter.checkId(id);
	//     }
	// }

	public buildQuery(object: any): IFilter {
		throw new Error("buildQuery not implemented.", object);
	}

	public static buildQueryStatic(object: any, factory: IFilter): IFilter {
		console.log("> LogicComparison.buildQueryStatic()");
		const key = Object.keys(object)[0]; // returns 'AND' | 'OR'
		if (key !== Logic.AND && key !== Logic.OR) {
			throw new Error("Invalid logic comparison");
		}

		const logic = key as Logic;
		if (object[key].length === 0) {
			throw new InsightError("Empty logic comparison");
		}
		const filters = object[key].map((f: any) => factory.buildQuery(f));

		return new LogicComparison(logic, filters);
	}
}
