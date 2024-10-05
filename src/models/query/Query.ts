import Where from "./Where";
import Options from "./Options";

export default class Query {
    public WHERE: Where;
    public OPTIONS: Options;

    constructor(where: Where, options: Options) {
        this.WHERE = where;
        this.OPTIONS = options;
    }

    public static buildQuery(object: any): Query {
        const WHERE = Where.buildQuery(object.WHERE);
        const OPTIONS = Options.buildQuery(object.OPTIONS);
        return new Query(WHERE, OPTIONS);
    }
}