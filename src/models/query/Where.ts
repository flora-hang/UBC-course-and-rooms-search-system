import IFilter from './IFilter';
import FilterFactory from './FilterFactory';

export default class Where {
    public filter?: IFilter;

    constructor(filter?: IFilter) {
        if (filter) { 
            this.filter = filter; 
        }
    }

    public static buildQuery(object: any): Where {
        let filter: IFilter;

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


}