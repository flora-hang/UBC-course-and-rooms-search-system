import Course from "./Course";
import Section from "./Section";
export default class Dataset {
	private readonly ID: string;
	private Courses: Course[];

	constructor(id: string) {
		this.ID = id;
		this.Courses = [];
	}
	public addCourse(course: Course[]): void {
		this.Courses = course;
	}
	public getId(): string {
		return this.ID;
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
		const sections: Section[] = [];
		for (const course of this.Courses) {
			sections.concat(course.getSections());
		}
		return sections;
	}
}
