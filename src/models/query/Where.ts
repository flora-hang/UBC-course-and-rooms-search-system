import IFilter from "./IFilter";
import FilterFactory from "./FilterFactory";
import { InsightError } from "../../controller/IInsightFacade";

export default class Where {
	public filter?: IFilter;

	constructor(filter?: IFilter) {
		if (filter) {
			this.filter = filter;
		}
	}

	public static buildQuery(object: any): Where {
		// console.log("> Where.buildQuery():", object);
		let filter: IFilter;

		if (Object.keys(object).length > 1) {
			throw new InsightError("Invalid WHERE: more than one filter");
		}
		const key = Object.keys(object)[0];

		if (!key || key.length === 0) {
			return new Where();
		} else {
			// WHERE is not empty:
			filter = new FilterFactory();
			filter = filter.buildQuery(object);
			return new Where(filter);
		}
	}

	// public checkId(id: string): void {
	//     if (this.filter) {
	//         this.filter.checkId(id);
	//     }
	// }
}
