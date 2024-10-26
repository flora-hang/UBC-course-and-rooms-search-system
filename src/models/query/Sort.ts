import { InsightError } from "../../controller/IInsightFacade";

export enum Direction {
    UP = "UP",
    DOWN = "DOWN"
}

// SORT ::= 'ORDER: { dir:'  DIRECTION ', keys: [ ' ANYKEY_LIST '] }' | 'ORDER: ' ANYKEY
export default class Sort {
    public dir?: Direction;
    public keys?: string[]; // ANYKEY_LIST
    public anyKey?: string; // ANYKEY

    constructor(dir?: Direction, keys?: string[], anyKey?: string) {
        if (dir && keys) {
            this.dir = dir;
            this.keys = keys;
        } else if (anyKey) {
            this.anyKey = anyKey;
        } else {
            throw new InsightError("Sort must have either dir and keys or anyKey");
        }
    }

    public static buildQuery(object: any): Sort {
        if (typeof object === "string") {
            return new Sort(undefined, undefined, object);
        } else {
            if (!object.dir || !object.keys) {
                throw new InsightError("Sort must have dir and keys");
            }
            if (object.dir !== Direction.UP && object.dir !== Direction.DOWN) {
                throw new InsightError("Sort dir must be UP or DOWN");
            }
            if (!Array.isArray(object.keys) || object.keys.length === 0) {
                throw new InsightError("Sort keys must be a non-empty array");
            }
            for (const key of object.keys) {
                if (typeof key !== "string") {
                    throw new InsightError("Sort keys must be strings");
                }
            }
            return new Sort(object.dir, object.keys);
        }
    }
}