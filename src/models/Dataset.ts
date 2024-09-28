import Course from "./Course";
import JSZip from "jszip";

export default class Dataset {
	private readonly ID: string;
	private totalSections: number;
	private Courses: Course[];

	constructor(id: string, total: number, courses: Course[]) {
		this.ID = id;
		this.totalSections = 0;
		this.Courses = courses;
	}

	public getId(): string {
		return this.ID;
	}

	public getTotalSections(): number {
		return this.totalSections;
	}

	public getCourses(): Course[] {
		return this.Courses;
	}
}
