import Section from "./Section";

export default class Course {
	private readonly Subject: string; // department of the course, e.g. CPSC
	private Sections: Section[];

	constructor(subj: string, sections: Section[]) {
		this.Subject = subj;
		this.Sections = sections;
	}
	public addSection(section: Section): void {
		this.Sections.push(section);
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
