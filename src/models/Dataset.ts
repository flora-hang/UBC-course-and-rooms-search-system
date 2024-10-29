import { InsightDatasetKind } from "../controller/IInsightFacade";

export abstract class Dataset {
	public abstract getId(): string;
	public abstract getKind(): InsightDatasetKind;
	public abstract getInsight(): any;
}
