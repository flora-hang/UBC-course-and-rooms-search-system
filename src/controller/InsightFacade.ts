import Dataset from "../models/Dataset";
import Section from "../models/Section";
import Course from "../models/Course";
import SectionData from "../models/SectionData";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
} from "./IInsightFacade";
import * as fsPromises from "fs/promises";
import fs from "fs-extra";
import JSZip from "jszip";
// import { json } from "stream/consumers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataDir = "./data";
	private datasets: Map<string, [Dataset, InsightDataset]> = new Map<string, [Dataset, InsightDataset]>();

	constructor() {
		// prob dont need constructor
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// id validation: (reject with InsightError if invalid)
		// - one of more of any character, except underscore
		// - id with only whitespace is invalid
		// - same id as an already added dataset is invalid
		if (id.trim().length === 0 || id.includes("_") || this.datasets.has(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		// kind validation:
		// - only valid kind is sections for c1
		if (kind !== InsightDatasetKind.Sections) {
			return Promise.reject(new InsightError("Invalid kind"));
		}

		// parse & validate content (async)
		const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

		// Test against the regex
		if (!base64Regex.test(content)) {
			return Promise.reject(new InsightError("Content not in base64 format"));
		}

		const dataset: Dataset = await this.processZip(id, content);

		const total: number = dataset.getTotalSections();
		const insight: InsightDataset = { id: id, numRows: total, kind: kind };
		this.datasets.set(id, [dataset, insight]);

		await this.saveDatasetToDisk(id); // need try catch?

		// return a string array containing the ids of all currently added datasets upon a successful add
		const fileNames = await fs.readdir(this.dataDir);
		const ids = fileNames.map((addedId) => addedId.replace(".json", ""));
		return ids;
	}

	public async removeDataset(id: string): Promise<string> {
		// id checking
		if (id.trim().length === 0 || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		if (!this.datasets.has(id)) {
			return Promise.reject(new NotFoundError("Dataset not found"));
		}

		// removing dataset
		const filePath = this.dataDir + `/${id}.json`;
		try {
			await fsPromises.unlink(filePath);
			this.datasets["delete"](id);
			return id;
		} catch (err) {
			return Promise.reject(new InsightError(`Error: ${err}`));
		}
	}

	

	public async listDatasets(): Promise<InsightDataset[]> {
		const cachedDatasets = await fs.readdir(this.dataDir);
		const datasetsIdArray: string[] = Array.from(this.datasets.values()).map((tuple) => tuple[1].id);

		// get all of the datasets from the disk in Dataset form/type
		const loadedDatasets: Dataset[] = await Promise.all(
			cachedDatasets.map(async (dataset) => await this.loadDatasetFromDisk(dataset.replace(".json", "")))
		);

		let count = 0; // used for indexing in the loadedDatasets array

		// looping through all datasets stored on disk to store missing datasets in map
		for (const dataset of cachedDatasets) {
			const datasetId: string = dataset.replace(".json", "");

			// if the current this.datasets doesn't include a dataset found within the disk, add to this.datasets
			if (!datasetsIdArray.includes(datasetId)) {
				// creating a InsightDataset object to later add to map
				const loadedInsightDataset: InsightDataset = {
					id: datasetId,
					kind: InsightDatasetKind.Sections,
					numRows: loadedDatasets[count].getTotalSections(),
				};
				this.datasets.set(datasetId, [loadedDatasets[count], loadedInsightDataset]); // adding tuple of Dataset and InsightDataset to this.datasets map
			}
			count++;
		}

		return Array.from(this.datasets.values()).map((tuple) => tuple[1]); // returning list of InsightDataset
	}

	// saves newly added dataset to disk
	// assumes that the dataset corresponding to the id is already in the datasets map
	private async saveDatasetToDisk(id: string): Promise<void> {
		const newDataset = this.datasets.get(id);
		const file = this.dataDir + "/" + id + ".json";
		await fs.ensureDir(this.dataDir); // could throw error
		await fs.writeJSON(file, newDataset); // could throw error (catch in addDataset?)
	}

	// loads dataset from disk
	// assumes that id is valid and corresponds to an existing dataset
	private async loadDatasetFromDisk(id: string): Promise<Dataset> {
		const file = this.dataDir + "/" + id + ".json";
		const dataset: Dataset = await fs.readJSON(file); // could throw error
		return dataset;
	}

	// JSZip = require("jszip");
	// Function to validate section data
	private validateSectionData(sectionData: SectionData): boolean {
		const requiredFields = ["id", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

		for (const field of requiredFields) {
			if (!(field in sectionData)) {
				return false; // return false
			}
		}

		return true; // return true if all fields
	}

	private handleSections(course: Course, jsonData: SectionData[]): Course {
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
			if (this.validateSectionData(sectionn)) {
				// Create the section object if validation passes
				const section = new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
				course.addSection(section);

				// console.log("section added: ", id);
			}
		});
		return course;
	}

	// Function to process the zip file using Promises
	private async processZip(id: string, content: string): Promise<Dataset> {
		const dataset = new Dataset(id);

		try {
			const zip = await JSZip.loadAsync(content, { base64: true }); // Load zip asynchronously
			const filteredFiles = this.filterFiles(zip);

			// iterating through courses in dataset
			const proms: any = [];
			const courses: Course[] = [];
			filteredFiles.map(async (filename: string) => {
				const courseName = filename.split("/")[1];
				const course = new Course(courseName);
				courses.push(course);
				proms.push(zip.files[filename].async("string"));
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
				handle.push(this.handleSections(course, jsonData));
			});
			const courseArray: Course[] = await Promise.all(handle);
			dataset.addCourse(courseArray);
		} catch (err) {
			throw new InsightError(`Error processing zip file: ${(err as Error).message}`);
		}

		if (dataset.getTotalSections() === 0) {
			return Promise.reject(new InsightError("No valid sections"));
		}

		return dataset;
	}

	private filterFiles(zip: JSZip): string[] {
		const coursesFiles = Object.keys(zip.files).filter((filename) => filename.startsWith("courses/"));
		const coursesFiltered: string[] = [];

		for (const file of coursesFiles) {
			if (file.split("/")[1].length !== 0 && !file.includes("_")) {
				coursesFiltered.push(file);
			}
		}
		// console.log("courses filtered: ", coursesFiltered);
		return coursesFiltered;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// Check if query is an object
		if (typeof query !== 'object' || query === null) {
			return Promise.reject(new InsightError("Query must be an object"));
		}

		// cast query to class Query !!!

		// validate & access query !!!
		// - filter sections (WHERE block)
		// - make required columns (OPTIONS: COLUMNS)
		// - order results (OPTIONS: ORDER)

		return Promise.reject(new InsightError("Not implemented yet")); //stub


	// 	const filteredSections = this.filterSections(query.input.WHERE);

    // // Parse OPTIONS block: Extract columns and order field
    // const columns = query.input.OPTIONS.COLUMNS;
    // const orderField = query.input.OPTIONS.ORDER;

    // // Sort the filtered results if ORDER is specified
    // let sortedSections = filteredSections;
    // if (orderField) {
    //     sortedSections = this.sortResults(filteredSections, orderField);
    // }

    // // Select the required columns
    // const finalResults = this.selectColumns(sortedSections, columns);

    // return finalResults;

	}

	// public filterSections(where: any, sections: Section[]): Section[] {
		// If WHERE block is empty, return all sections (no filtering)
		//!!! get all sections in the dataset
		// if (Object.keys(where).length === 0) {
		// 	return sections;
		// }
	
		// // Process logical operators
		// if (where.AND) {
		// 	return this.handleAND(where.AND, sections);
		// }
		// if (where.OR) {
		// 	return this.handleOR(where.OR, sections);
		// }
		// if (where.NOT) {
		// 	return this.handleNOT(where.NOT, sections);
		// }
	
		// // Process comparison operators (EQ, GT, LT, IS)
		// if (where.EQ) {
		// 	return this.handleEQ(where.EQ, sections);
		// }
		// if (where.GT) {
		// 	return this.handleGT(where.GT, sections);
		// }
		// if (where.LT) {
		// 	return this.handleLT(where.LT, sections);
		// }
		// if (where.IS) {
		// 	return this.handleIS(where.IS, sections);
		// }
	
		// // If no valid operator is found, return all sections (shouldn't happen)
		// return sections;
	// }

	// public handleAND(conditions: any[], sections: Section[]): Section[] {
	// 	return conditions.reduce((acc, condition) => {
	// 		return this.filterSections(condition, acc);
	// 	}, sections); // Apply each condition on the filtered result
	// }
	
	// public handleOR(conditions: any[], sections: Section[]): Section[] {
	// 	const results = conditions.map(condition => this.filterSections(condition, sections));
	// 	// Merge all results (union)
	// 	return results.flat();
	// }
	
	// public handleNOT(condition: any, sections: Section[]): Section[] {
	// 	const filteredSections = this.filterSections(condition, sections);
	// 	// Return sections that are NOT in the filtered set
	// 	return sections.filter(section => !filteredSections.includes(section));
	// }
	// public handleEQ(condition: any, sections: Section[]): Section[] {
	// 	const [field, value] = Object.entries(condition)[0];
	// 	return sections.filter(section => section[field] === value);
	// }
	
	// public handleGT(condition: any, sections: Section[]): Section[] {
	// 	const [field, value] = Object.entries(condition)[0];
	// 	return sections.filter(section => section[field] > value);
	// }
	
	// public handleLT(condition: any, sections: Section[]): Section[] {
	// 	const [field, value] = Object.entries(condition)[0];
	// 	return sections.filter(section => section[field] < value);
	// }
	
	// public handleIS(condition: any, sections: Section[]): Section[] {
	// 	const [field, value] = Object.entries(condition)[0];
	// 	return sections.filter(section => section[field] === value);
	// }
}
