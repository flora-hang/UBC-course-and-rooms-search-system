import ConditionNode from "./ConditionNode";
import AndNode from "./ANDNode";
import ComparisonNode from "./ComparisonNode"
import OrNode from "./ORNode"
export default class Query {
    private where: ConditionNode;
    private columns: string[];
    private order: string | null;

    constructor(query: any) {
        this.where = this.buildWhere(query.WHERE);    // Recursive building of the WHERE block
        this.columns = query.OPTIONS.COLUMNS;         // List of columns to return
        this.order = query.OPTIONS.ORDER || null;     // Order by a specific field (optional)
    }

    // Recursive function to build the WHERE clause as an AST
    private buildWhere(whereClause: any): ConditionNode {
        if (whereClause.AND) {
            return new AndNode(whereClause.AND.map((subClause: any) => this.buildWhere(subClause)));
        } else if (whereClause.OR) {
            return new OrNode(whereClause.OR.map((subClause: any) => this.buildWhere(subClause)));
        } else if (whereClause.NOT) {
            return new NotNode(this.buildWhere(whereClause.NOT));
        } else if (whereClause.GT) {
            return new ComparisonNode("GT", whereClause.GT);
        } else if (whereClause.LT) {
            return new ComparisonNode("LT", whereClause.LT);
        } else if (whereClause.EQ) {
            return new ComparisonNode("EQ", whereClause.EQ);
        } else if (whereClause.IS) {
            return new ComparisonNode("IS", whereClause.IS);
        }
        throw new Error("Invalid WHERE clause");
    }

    
}