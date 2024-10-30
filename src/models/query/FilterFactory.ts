import IFilter from "./IFilter";
import LogicComparison from "./LogicComparison";
import MComparison from "./MComparison";
import SComparison from "./SComparison";
import Negation from "./Negation";
import { InsightError } from "../../controller/IInsightFacade";

// FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
export default class FilterFactory implements IFilter {
	public buildQuery(object: any): IFilter {
		let filter: IFilter;

		const key = Object.keys(object)[0];
		// returns 'AND' | 'OR' | 'GT' | 'LT' | 'EQ' | 'IS' | 'NOT'

		switch (key) {
			case "AND":
			case "OR":
				filter = LogicComparison.buildQueryStatic(object, this);
				break;
			case "GT":
			case "LT":
			case "EQ":
				filter = MComparison.buildQuery(object);
				break;
			case "IS":
				filter = SComparison.buildQuery(object);
				break;
			case "NOT":
				filter = Negation.buildQueryStatic(object, this);
				break;
			default:
				throw new InsightError("Unknown filter type");
		}

		return filter;
	}
}
