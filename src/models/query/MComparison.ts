import Filter from './Filter';

export enum MComparator {
    LT = 'LT',
    GT = 'GT',
    EQ = 'EQ'
}

export default class MComparison extends Filter {
    public mComparator: MComparator;
    public mkey: string; // mkey ::= '"' idstring '_' mfield '"'
    public value: number;

    constructor(mComparator: MComparator, mkey: string, value: number) {  
        super();  
        this.mComparator = mComparator;
        this.mkey = mkey;
        this.value = value;
    }

    public static buildQuery(object: any): Filter {
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