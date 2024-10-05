import IFilter from "./IFilter";

export default class SComparison implements IFilter {
    public skey: string; // skey ::= '"' idstring '_' sfield '"'
    public inputString: string;

    constructor(skey: string, inputString: string) {    
        this.skey = skey;
        this.inputString = inputString;
    }

    public buildQuery(object: any): IFilter {
        throw new Error("buildQuery not implemented.", object);
    }

    public static buildQuery(object: any): IFilter {
        const key = Object.keys(object)[0]; // returns 'IS'
        if (key !== 'IS') {
            throw new Error('Invalid logic comparison');
        }

        const skey = Object.keys(object[key])[0];
        const inputString = object[key][skey]; //!!! have to deal with wildcards later

        return new SComparison(skey, inputString);
    }
}