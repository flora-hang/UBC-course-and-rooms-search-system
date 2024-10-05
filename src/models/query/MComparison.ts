import IFilter from "./IFilter";

export enum MComparator {
    LT = 'LT',
    GT = 'GT',
    EQ = 'EQ'
}

export default class MComparison implements IFilter {
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
        const key = Object.keys(object)[0]; // returns 'GT' | 'LT' | 'EQ'
        if (key !== MComparator.LT && key !== MComparator.GT && key !== MComparator.EQ) {
            throw new Error('Invalid M comparison');
        }
        const mComparator = key as MComparator;

        const mkey = Object.keys(object[key])[0]; // e.g. returns "sections_avg"
        const value = object[key][mkey];

        return new MComparison(mComparator, mkey, value);
    }
}