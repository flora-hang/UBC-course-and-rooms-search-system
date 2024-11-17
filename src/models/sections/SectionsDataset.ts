import { InsightDataset, InsightDatasetKind } from "../../controller/IInsightFacade";
import { Dataset } from "../Dataset";
import Section from "./Section";

export default class SectionsDataset extends Dataset {
	private readonly id: string;
	private kind: InsightDatasetKind = InsightDatasetKind.Sections;
	// private Courses: Course[];
	private sections: Section[];

	constructor(id: string) {
		super();
		this.id = id;
		// this.Courses = [];
		this.sections = [];
	}

	// public addCourses(courses: Course[]): void {
	// 	this.Courses = courses;
	// }

	public getId(): string {
		return this.id;
	}

	public getKind(): InsightDatasetKind {
		return this.kind;
	}

	public getTotalSections(): number {
		// let total = 0;
		// this.Courses.forEach((course) => (total += course.getNumSections()));
		// return total;
		return this.sections.length;
	}

	// public getCourses(): Course[] {
	// 	return this.Courses;
	// }

	public getSections(): Section[] {
		// let sections: Section[] = [];
		// for (const course of this.Courses) {
		// 	sections = sections.concat(course.getSections());
		// }
		// return sections;
		return this.sections;
	}

	public getInsight(): InsightDataset {
		return {
			id: this.id,
			kind: InsightDatasetKind.Sections,
			numRows: this.getTotalSections(),
		};
	}

	public setKind(kind: InsightDatasetKind): void {
		this.kind = kind;
	}

	public getItems(): Section[] {
		return this.getSections();
	}

	public setItems(sections: Section[]): void {
		this.sections = sections;
	}
}
