import ConditionNode from './ConditionNode'
import Section from './Section'

export default class ComparisonNode extends ConditionNode {
    private operation: string;
    private comparisonField: string;
    private value: any;

    constructor(operation: string, comparison: any) {
        super();
        this.operation = operation;
        this.comparisonField = Object.keys(comparison)[0];
        this.value = comparison[this.comparisonField];
    }

    evaluate(section: Section): boolean {
        //figure out a way to look for specific field
        const sectionValue = section.getField(this.comparisonField);
        switch (this.operation) {
            case "GT":
                return sectionValue > this.value;
            case "LT":
                return sectionValue < this.value;
            case "EQ":
                return sectionValue === this.value;
            case "IS":
                return sectionValue === this.value;
            default:
                throw new Error("Unknown comparison operation");
        }
    }
}
