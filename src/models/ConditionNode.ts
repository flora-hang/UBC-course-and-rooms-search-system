import Section from "./Section";
export default abstract class ConditionNode {
    abstract evaluate(section: Section): boolean;
}