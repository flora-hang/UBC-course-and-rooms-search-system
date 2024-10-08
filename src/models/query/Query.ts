import Where from "./Where";
import Options from "./Options";
import { InsightError } from "../../controller/IInsightFacade";

export default class Query {
    public WHERE: Where;
    public OPTIONS: Options;

    constructor(where: Where, options: Options) {
        this.WHERE = where;
        this.OPTIONS = options;
    }

    public static buildQuery(object: any): Query {
        console.log('> Query.buildQuery()');
        if (!object.WHERE) {
            throw new InsightError("Query must have a WHERE block");
        }
        
        if (!object.OPTIONS) {
            throw new InsightError("Query must have an OPTIONS block");
        }
        
        const WHERE = Where.buildQuery(object.WHERE);
        const OPTIONS = Options.buildQuery(object.OPTIONS);
        return new Query(WHERE, OPTIONS);
    }
}