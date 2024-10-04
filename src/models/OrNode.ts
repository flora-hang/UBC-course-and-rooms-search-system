import ConditionNode from './ConditionNode'
import Section from './Section'
export default class OrNode extends ConditionNode {
    private conditions: ConditionNode[];

    constructor(conditions: ConditionNode[]) {
        super();
        this.conditions = conditions;
    }

    evaluate(section: Section): boolean {
        return this.conditions.some(cond => cond.evaluate(section));
    }
}
