import Section from "./Section";

export default class Course {
	private readonly Subject: string; // department of the course, e.g. CPSC
	private readonly Sections: Section[];

	constructor(subj: string, sections: Section[]) {
		this.Subject = subj;
		this.Sections = sections;
	}

	public getSubject(): string {
		return this.Subject;
	}

	public getNumSections(): number {
		return this.Sections.length;
	}

	public getSections(): Section[] {
		return this.Sections;
	}
}
