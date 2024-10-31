import { InsightError } from "../controller/IInsightFacade";
import Course from "../models/sections/Course";
import Section from "../models/sections/Section";
import SectionsDataset from "../models/sections/SectionsDataset";
import SectionData from "../models/sections/SectionData";
import JSZip from "jszip";

// JSZip = require("jszip");
// Function to validate section data
export function validateSectionData(sectionData: SectionData): boolean {
	const requiredFields = ["id", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

	for (const field of requiredFields) {
		if (!(field in sectionData)) {
			return false; // return false
		}
	}

	return true; // return true if all fields
}

export function handleSections(course: Course, jsonData: SectionData[]): Course {
	jsonData.map((sectionn: SectionData) => {
		const {
			id: uuid,
			Course: id,
			Title: title,
			Professor: instructor,
			Subject: dept,
			Year: year,
			Avg: avg,
			Pass: pass,
			Fail: fail,
			Audit: audit,
		} = sectionn;

		// if sectionn is valid, then add the section
		if (validateSectionData(sectionn)) {
			// Create the section object if validation passes
			const section = new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
			course.addSection(section);
		}
	});
	return course;
}

// Function to process the zip file using Promises
export async function processZip(id: string, content: string): Promise<SectionsDataset> {
	const dataset = new SectionsDataset(id);

	try {
		const zip = await JSZip.loadAsync(content, { base64: true }); // Load zip asynchronously
		const filteredFiles = filterFiles(zip);

		// iterating through courses in dataset
		const proms: Promise<string>[] = [];
		const courses: Course[] = [];
		filteredFiles.map((filename: string) => {
			const courseName = filename.split("/")[1];
			courses.push(new Course(courseName));
			const f = zip.files[filename];
			proms.push(f.async("string"));
		});
		const array = await Promise.all(proms); // Wait for all files to be processed

		const handle: any = [];
		array.forEach((element, index) => {
			let jsonData: SectionData[] = [];
			try {
				jsonData = JSON.parse(element).result; // Assuming 'result' is an array of sections
			} catch (_err) {
				return; // skip this file
			}
			const course = courses[index];
			handle.push(handleSections(course, jsonData));
		});
		const courseArray: Course[] = await Promise.all(handle);
		dataset.addCourses(courseArray);
	} catch (err) {
		throw new InsightError(`Error processing zip file: ${(err as Error).message}`);
	}

	if (dataset.getTotalSections() === 0) {
		return Promise.reject(new InsightError("No valid sections"));
	}

	return dataset;
}

export function filterFiles(zip: JSZip): string[] {
	const coursesFiles = Object.keys(zip.files).filter((filename) => filename.startsWith("courses/"));
	const coursesFiltered: string[] = [];

	for (const file of coursesFiles) {
		if (file.split("/")[1].length !== 0 && !file.includes("_")) {
			coursesFiltered.push(file);
		}
	}
	return coursesFiltered;
}
