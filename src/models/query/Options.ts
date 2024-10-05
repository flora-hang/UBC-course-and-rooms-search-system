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
        const columns = object.COLUMNS;

        if ('ORDER' in object) {
            const order = object.ORDER;
            return new Options(columns, order);
        } else {
            return new Options(columns);
        }
    }
}