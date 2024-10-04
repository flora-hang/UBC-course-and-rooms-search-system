import Filter from './Filter';
import LogicComparison from './LogicComparison';
import MComparison from './MComparison';
import SComparison from './SComparison';
import Negation from './Negation';

export default class Where {
    public filter?: Filter;

    constructor(filter?: Filter) {
        if (filter) this.filter = filter;
    }

    //!!! maybe put this in Filter.ts and only call if there is a filter
    public static buildQuery(object: any): Where {
        // 4 cases: LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | 
        const key = Object.keys(object)[0]; 
        // returns 'AND' | 'OR' | 'GT' | 'LT' | 'EQ' | 'IS' | 'NOT'

        let filter: Filter;

        switch (key) {
            case 'AND':
            case 'OR':
                filter = LogicComparison.buildQuery(object);
                break;
            case 'GT':
            case 'LT':
            case 'EQ':
                filter = MComparison.buildQuery(object);
                break;
            case 'IS':
                filter = SComparison.buildQuery(object);
                break;
            case 'NOT':
                filter = Negation.buildQuery(object);
                break;
            default:
                throw new Error('Unknown filter type');
        }

        return new Where(filter);

    }

}