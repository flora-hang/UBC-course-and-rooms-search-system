import Filter from './Filter';

export default class Where {
    public filter?: Filter;

    constructor(filter?: Filter) {
        if (filter) { 
            this.filter = filter; 
        }
    }

    public static buildQuery(object: any): Where {

        let filter: Filter;

        const key = Object.keys(object)[0]; 

        if (key.length === 0) {
            return new Where();
        } else {
            filter = Filter.buildQuery(object);
        }

        return new Where(filter);
    }

}