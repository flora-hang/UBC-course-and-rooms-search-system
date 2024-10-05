import Filter from './Filter';
console.log("-------", Filter);

export enum Logic {
    AND = 'AND',
    OR = 'OR',
}

export default class LogicComparison extends Filter {
    public logic: Logic;
    public filters: Filter[];

    constructor(logic: Logic, filters: Filter[]) {
        super();
        this.logic = logic;
        this.filters = filters;
    }

    public static buildQuery(object: any): Filter {
        const key = Object.keys(object)[0]; // returns 'AND' | 'OR'
        if (key !== Logic.AND && key !== Logic.OR) {
            throw new Error('Invalid logic comparison');
        }

        const logic = key as Logic;
        const filters = object[key].map((f: any) => Filter.buildQuery(f)); 

        return new LogicComparison(logic, filters);
    }
}

