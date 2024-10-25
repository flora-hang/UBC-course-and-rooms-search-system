import { InsightDataset, InsightDatasetKind } from "../../controller/IInsightFacade";
import { Dataset } from "../Dataset";
import Course from "./Course";
import Section from "./Section";

export default class SectionsDataset extends Dataset {
	private readonly id: string;
	private readonly kind: InsightDatasetKind = InsightDatasetKind.Sections;
	private Courses: Course[];

	constructor(id: string) {
		super();
		this.id = id;
		this.Courses = [];
	}

	public addCourses(courses: Course[]): void {
		this.Courses = courses;
	}

	public getId(): string {
		return this.id;
	}

	public getKind(): InsightDatasetKind {
		return this.kind;
	}

	public getTotalSections(): number {
		let total = 0;
		this.Courses.forEach((course) => (total += course.getNumSections()));
		return total;
	}

	public getCourses(): Course[] {
		return this.Courses;
	}

	public getSections(): Section[] {
		let sections: Section[] = [];
		for (const course of this.Courses) {
			sections = sections.concat(course.getSections());
		}
		return sections;
	}

	public getInsight(): InsightDataset {
		return {
			id: this.id,
			kind: InsightDatasetKind.Sections,
			numRows: this.getTotalSections(),
		};
	}
}
