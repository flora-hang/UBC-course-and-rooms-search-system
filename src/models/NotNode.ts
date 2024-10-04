import ConditionNode from './ConditionNode'
import Section from './Section'
export default class NotNode extends ConditionNode {
    private conditions: ConditionNode[];

    constructor(conditions: ConditionNode[]) {
        super();
        this.conditions = conditions;
    }
    //evaluate needs tweaking
    evaluate(section: Section): boolean {
        return this.conditions.every(cond => cond.evaluate(section));
    }
}