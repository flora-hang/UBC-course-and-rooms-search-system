import { InsightError } from "../../controller/IInsightFacade";
import { MField } from "./MComparison";
import { SField } from "./SComparison";

export default class Options {
    public columns: string[];
    public order?: string;

    constructor(columns: string[], order?: string) {
        this.columns = columns;
        if (order) { 
            this.order = order; 
        }
    }

    public static buildQuery(object: any): Options {
        console.log('> Options.buildQuery()');
        if (!object.COLUMNS) {
            throw new InsightError('no COLUMNS in OPTIONS');
        }

        const columns = object.COLUMNS;
        if (!Array.isArray(columns) || columns.length === 0) {
            throw new InsightError('Columns must be a non-empty array');
        }
        // check that each column is valid
        for (const column of columns) {
            if (typeof column !== 'string') {
                throw new InsightError('Column must be a string');
            }

            const parts = column.split('_');
            const numParts = 2;
            if (parts.length !== numParts) {
                throw new InsightError('Invalid column format');
            }

            // check that id is valid??? 
            // !!!
            
            // check that parts[1] is either a mfield or sfield
            if (!(parts[1] in MField) && !(parts[1] in SField)) {
                throw new InsightError('Invalid mfield/sfield in columns');
            }
        }

        if ('ORDER' in object) {
            const order = object.ORDER;
            return new Options(columns, order);
        } else {
            return new Options(columns);
        }
    }
}