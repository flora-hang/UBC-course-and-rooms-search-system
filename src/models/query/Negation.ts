import WHERE from './Where';
import Filter from './Filter';

export default class Negation extends Filter {
    public filter: Filter;

    constructor(filter: Filter) {
        super();
        this.filter = filter;
    }

    public static buildQuery(object: any): Filter {
        const key = Object.keys(object)[0]; // returns 'NOT'
        if (key !== 'NOT') {
            throw new Error('Invalid negation');
        }

        const filter = WHERE.buildQuery(object[key]); //!!! this returns a Where object

        return new Negation(filter);
    }
}