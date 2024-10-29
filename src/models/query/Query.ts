import Where from "./Where";
import Options from "./Options";
import { InsightError } from "../../controller/IInsightFacade";
import Transformations from "./Transformations";

export default class Query {
	public WHERE: Where;
	public OPTIONS: Options;
	public TRANSFORMATIONS?: Transformations;

	constructor(where: Where, options: Options, transformations?: Transformations) {
		this.WHERE = where;
		this.OPTIONS = options;
		if (transformations) {
			this.TRANSFORMATIONS = transformations;
		}
	}

	public static buildQuery(object: any): Query {
		if (!object.WHERE) {
			throw new InsightError("Query must have a WHERE block");
		}

		if (!object.OPTIONS) {
			throw new InsightError("Query must have an OPTIONS block");
		}

		const WHERE = Where.buildQuery(object.WHERE);
		const OPTIONS = Options.buildQuery(object.OPTIONS);

		if (!object.TRANSFORMATIONS) {
			return new Query(WHERE, OPTIONS);
		} else {
			const TRANSFORMATIONS = Transformations.buildQuery(object.TRANSFORMATIONS);
			return new Query(WHERE, OPTIONS, TRANSFORMATIONS);
		}
	}
}
