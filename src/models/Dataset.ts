import Course from "./Course";

export default class Dataset {
	private readonly ID: string;
	private Courses: Course[];

	constructor(id: string, courses: Course[]) {
		this.ID = id;
		this.Courses = courses;
	}
	public addCourse(course: Course): void {
		this.Courses.push(course);
	}
	public getId(): string {
		return this.ID;
	}

	public getTotalSections(): number {
		return this.Courses.length;
	}

	public getCourses(): Course[] {
		return this.Courses;
	}
}
