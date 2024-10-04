import ConditionNode from './ConditionNode'
import Section from './Section'
export default class NotNode extends ConditionNode {
    private condition: ConditionNode;

    constructor(condition: ConditionNode) {
        super();
        this.condition = condition;
    }
    //evaluate needs tweaking
    evaluate(section: Section): boolean {
        return false; //stub
        // return this.condition.(cond => cond.evaluate(section));
    }
}