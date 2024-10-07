import { InsightError } from '../../controller/IInsightFacade';
import IFilter from './IFilter';

export default class Negation implements IFilter {
    public filter: IFilter;

    constructor(filter: IFilter) {
        this.filter = filter;
    }

    public buildQuery(object: any): IFilter {
        throw new Error('buildQuery not implemented.', object);
    }

    public static buildQueryStatic(object: any, factory: IFilter): IFilter {
        const key = Object.keys(object)[0]; // returns 'NOT'
        if (key !== 'NOT') {
            throw new Error('Invalid negation');
        }
        if (!object[key] || typeof object[key] !== 'object') {
            throw new InsightError('Empty negation');
        }
        const filter = factory.buildQuery(object[key]); 

        return new Negation(filter);
    }
}