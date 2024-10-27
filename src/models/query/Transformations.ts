import ApplyRule from "./ApplyRule";

// TRANSFORMATIONS ::= 'TRANSFORMATIONS: {' GROUP ', ' APPLY '}'
export default class Transformations {
    public GROUP: string[];
    public APPLY: ApplyRule[]; // can be empty

    constructor(group: string[], apply: ApplyRule[]) {
        this.GROUP = group;
        this.APPLY = apply;
    }

    public static buildQuery(object: any): Transformations {
        if (!object.GROUP) {
            throw new Error("Transformations must have a GROUP block");
        }
        if (!object.APPLY) {
            throw new Error("Transformations must have an APPLY block");
        }
        const group: string[] = object.GROUP;
        if (!Array.isArray(group) || group.length === 0) {
            throw new Error("GROUP must be a non-empty array");
        }
        const apply: ApplyRule[] = [];
        for (const applyRule of object.APPLY) {
            apply.push(ApplyRule.buildQuery(applyRule));
        }
        return new Transformations(group, apply);
    }
}