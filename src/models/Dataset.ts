import { InsightDatasetKind } from "../controller/IInsightFacade";

export abstract class Dataset {
	public abstract getId(): string;
	public abstract getKind(): InsightDatasetKind;
	public abstract getInsight(): any;
	public abstract getItems(): any[];
	public abstract setKind(kind: InsightDatasetKind): void;
	public abstract setItems(items: any[]): void;
}
