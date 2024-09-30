import Course from "./Course";

export default class Dataset {
	private readonly ID: string;
	private Courses: Course[];

	constructor(id: string) {
		this.ID = id;
		this.Courses = [];
	}
	public addCourse(course: Course): void {
		this.Courses.push(course);
	}
	public getId(): string {
		return this.ID;
	}

	public getTotalSections(): number {
		let total: number = 0;
		this.Courses.forEach((course) => (total += course.getNumSections()));

		return total;
	}

	public getCourses(): Course[] {
		return this.Courses;
	}
}
