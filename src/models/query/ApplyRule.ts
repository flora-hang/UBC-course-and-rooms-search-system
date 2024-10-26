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
}