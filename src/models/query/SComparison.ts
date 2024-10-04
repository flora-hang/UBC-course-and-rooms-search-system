import Filter from "./Filter";

export default class SComparison extends Filter {
    public skey: string; // skey ::= '"' idstring '_' sfield '"'
    public inputString: string;

    constructor(skey: string, inputString: string) {    
        super();
        this.skey = skey;
        this.inputString = inputString;
    }

    public static buildQuery(object: any): Filter {
        const key = Object.keys(object)[0]; // returns 'IS'
        if (key !== 'IS') {
            throw new Error('Invalid logic comparison');
        }

        const skey = Object.keys(object[key])[0];
        const inputString = object[key][skey]; //!!! have to deal with wildcards later

        return new SComparison(skey, inputString);
    }
}