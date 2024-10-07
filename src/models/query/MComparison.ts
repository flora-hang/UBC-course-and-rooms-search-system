import { InsightError } from "../../controller/IInsightFacade";
import IFilter from "./IFilter";

export enum MComparator {
    LT = 'LT',
    GT = 'GT',
    EQ = 'EQ'
}

export enum MField {
    avg = 'avg',
    pass = 'pass',
    fail = 'fail',
    audit = 'audit',
    year = 'year'
}

export default class MComparison implements IFilter {
    private static id?: string; //!!! want to check that the query is only querying from one existing dataset
    public mComparator: MComparator;
    public mkey: string; // mkey ::= '"' idstring '_' mfield '"'
    public value: number;

    constructor(mComparator: MComparator, mkey: string, value: number) {  
        this.mComparator = mComparator;
        this.mkey = mkey;
        this.value = value;
    }

    public buildQuery(object: any): IFilter {
        throw new Error("buildQuery not implemented.", object);
    }

    public static buildQuery(object: any): IFilter {
        console.log('> MComparison.buildQuery()');
        const key = Object.keys(object)[0]; // returns 'GT' | 'LT' | 'EQ'
        if (key !== MComparator.LT && key !== MComparator.GT && key !== MComparator.EQ) {
            throw new Error('Invalid M comparison');
        }
        const mComparator = key as MComparator;

        if (!object[key] || Object.keys(object[key]).length === 0) {
            throw new InsightError('M comparison must have a mkey and value');
        }

        const mkey = Object.keys(object[key])[0]; // e.g. returns "sections_avg"
        const parts = mkey.split('_');
        const numParts = 2;
        if (parts.length !== numParts) {
            throw new InsightError('Invalid mkey format');
        }
        if (!this.id && parts[0].length > 0) { // no id yet
            this.id = parts[0];
        } else { // id already exist, check that it's the same
            if (this.id !== parts[0]) {
                throw new InsightError('Cannot query from multiple datasets');
            }
        }
        // check that mfield is valid
        if (!(parts[1] in MField)) {
            throw new InsightError('Invalid mfield');
        }
        const value = object[key][mkey];
        // check that value is a number
        if (typeof value !== 'number') {
            throw new InsightError('Value must be a number');
        }

        return new MComparison(mComparator, mkey, value);
    }
}