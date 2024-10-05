import IFilter from './IFilter';
import LogicComparison from './LogicComparison';
import MComparison from './MComparison';
import SComparison from './SComparison';
import Negation from './Negation';

// FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
export default class FilterFactory implements IFilter {

    constructor() {
        // Empty constructor
    }

    public buildQuery(object: any): IFilter {
        let filter: IFilter;

        const key = Object.keys(object)[0]; 
        // returns 'AND' | 'OR' | 'GT' | 'LT' | 'EQ' | 'IS' | 'NOT'

        switch (key) {
            case 'AND':
            case 'OR':
                filter = LogicComparison.buildQueryStatic(object, this);
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
                filter = Negation.buildQueryStatic(object, this);
                break;
            default:
                throw new Error('Unknown filter type');
        }

        return filter;
    }

    // public static buildQuery(object: any): FilterFactory {

    //     let filter: FilterFactory;

    //     const key = Object.keys(object)[0]; 
    //     // returns 'AND' | 'OR' | 'GT' | 'LT' | 'EQ' | 'IS' | 'NOT'

    //     switch (key) {
    //         case 'AND':
    //         case 'OR':
    //             filter = LogicComparison.buildQuery(object);
    //             break;
    //         case 'GT':
    //         case 'LT':
    //         case 'EQ':
    //             filter = MComparison.buildQuery(object);
    //             break;
    //         case 'IS':
    //             filter = SComparison.buildQuery(object);
    //             break;
    //         case 'NOT':
    //             filter = Negation.buildQuery(object);
    //             break;
    //         default:
    //             throw new Error('Unknown filter type');
    //     }

    //     return filter;
    // }

    
}

