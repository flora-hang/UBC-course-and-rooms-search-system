import LogicComparison from './LogicComparison';
import MComparison from './MComparison';
import SComparison from './SComparison';
import Negation from './Negation';

// FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
export default class Filter {

    constructor() {
        // Empty constructor
    }

    public static buildQuery(object: any): Filter {

        let filter: Filter;

        const key = Object.keys(object)[0]; 
        // returns 'AND' | 'OR' | 'GT' | 'LT' | 'EQ' | 'IS' | 'NOT'

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

        return filter;
    }

    
}

