export enum ApplyToken {
    MAX = "MAX",
    MIN = "MIN",
    AVG = "AVG",
    COUNT = "COUNT",
    SUM = "SUM"
}

export default class ApplyRule {
    public applyKey: string; // One or more of any character, except underscore.
    public applyToken: ApplyToken;
    public key: string; // KEY ::= mkey | skey // (e.g. rooms_seats)

    constructor(applyKey: string, applyToken: ApplyToken, key: string) {
        this.applyKey = applyKey;
        this.applyToken = applyToken;
        this.key = key;
    }

    public static buildQuery(object: any): ApplyRule {
        const applyKey = Object.keys(object)[0];
        const nestedObject = object[applyKey];
        const applyToken = Object.keys(nestedObject)[0] as ApplyToken;
        const key = nestedObject[applyToken];

        return new ApplyRule(applyKey, applyToken, key);
    }
}