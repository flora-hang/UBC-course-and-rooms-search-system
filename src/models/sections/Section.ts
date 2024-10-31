import { InsightError } from "../../controller/IInsightFacade";
import Item from "../query/Item";

export default class Section extends Item {
	private readonly uuid: string; // "id" A identifier for the section
	private readonly id: string; // "Course" The course identifier
	private readonly title: string; // "Title" The name of the course
	private readonly instructor: string; // "Professor" The name fo the instructor who taught the section
	private readonly dept: string; // "Subject" The department which offered the section
	private readonly year: number; // "Year" The year in which the section was run. Set to 1900 when Section = overall
	private readonly avg: number; // "Avg" The average grade received by students in section
	private readonly pass: number; // "Pass" The number of students who passed in the section
	private readonly fail: number; // "Fail" The number of students who failed in the section
	private readonly audit: number; // "Audit" The number of students who audited the section

	constructor(
		uuid: string,
		id: string,
		title: string,
		instructor: string,
		dept: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		super();
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}

	public getField(comparisonField: string): any {
		switch (comparisonField) {
			case "uuid":
				return this.getUuid();
			case "id":
				return this.getId();
			case "title":
				return this.getTitle();
			case "instructor":
				return this.getInstructor();
			case "dept":
				return this.getDept();
			case "year":
				return this.getYear();
			case "avg":
				return this.getAvg();
			case "pass":
				return this.getPass();
			case "fail":
				return this.getFail();
			case "audit":
				return this.getAudit();
			default:
				throw new InsightError("Error: Called getField() with an invalid comparisonField arg.");
		}
	}

	public getUniqueIdentifier(): string {
		return this.getUuid();
	}

	public getUuid(): string {
		return this.uuid;
	}

	public getId(): string {
		return this.id;
	}

	public getTitle(): string {
		return this.title;
	}

	public getInstructor(): string {
		return this.instructor;
	}

	public getDept(): string {
		return this.dept;
	}

	public getYear(): number {
		return this.year;
	}

	public getAvg(): number {
		return this.avg;
	}

	public getPass(): number {
		return this.pass;
	}

	public getFail(): number {
		return this.fail;
	}

	public getAudit(): number {
		return this.audit;
	}
	// // Override equals method to compare instances
	// equals(other: Section): boolean {
	// 	if (this === other) return true;
	// 	if (other == null || this.constructor !== other.constructor) return false;
	// 	return this.uuid === other.uuid;
	// }
}
