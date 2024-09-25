import Section from "./Section";

export default class Course {
	private readonly Subject: string; // department of the course, e.g. CPSC
	private readonly NumSections: number; // number of sections in this course
	private readonly Sections: Section[];

	constructor(subj: string, numS: number, sections: Section[]) {
		this.Subject = subj;
		this.NumSections = numS;
		this.Sections = sections;
	}

	public getSubject(): string {
		return this.Subject;
	}

	public getNumSections(): number {
		return this.NumSections;
	}

	public getSections(): Section[] {
		return this.Sections;
	}
}
