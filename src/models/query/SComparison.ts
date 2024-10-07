import { InsightError } from "../../controller/IInsightFacade";
import IFilter from "./IFilter";

export enum SField {
    dept = 'dept',
    id = 'id',
    instructor = 'instructor',
    title = 'title',
    uuid = 'uuid'
}

export default class SComparison implements IFilter {
    private static id: string; //!!! see MComparison.ts for explanation
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
        if (!object[key] || Object.keys(object[key]).length === 0) {
            throw new InsightError('S comparison must have a mkey and value');
        }

        const skey = Object.keys(object[key])[0];
        const parts = skey.split('_');
        const numParts = 2;
        if (parts.length !== numParts) {
            throw new InsightError('Invalid skey format');
        }
        //---------------------------------------
        if (!this.id && parts[0].length > 0) { // no id yet
            this.id = parts[0];
        } else { // id already exist, check that it's the same
            if (this.id !== parts[0]) {
                throw new InsightError('Cannot query from multiple datasets');
            }
        }
        //---------------------------------------
        // check that mfield is valid
        if (!(parts[1] in SField)) {
            throw new InsightError('Invalid sfield');
        }
        const inputString = object[key][skey]; 
        if (typeof inputString !== 'string') {
            throw new InsightError('inputString must be a string');
        }
        //!!! deal with wildcards *

        return new SComparison(skey, inputString);
    }
}