import Dataset from "../models/Dataset";
import Section from "../models/Section";
import Course from "../models/Course";
import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError } from "./IInsightFacade";
import * as fsPromises from "fs/promises";
import fs from "fs-extra";
import JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: Map<string, [Dataset, InsightDataset]> = new Map<string, [Dataset, InsightDataset]>();

	constructor() {
		// load data from disk !!!
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// TODO: Remove this once you implement the methods!
		// throw new Error(
		// 	`InsightFacadeImpl::addDataset() is unimplemented! - id=${id}; content=${content?.length}; kind=${kind}`
		// );

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
		const base64Pattern = /^(?:[A-Z0-9+/]{4})*([A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i; // Regular expression to check if the string is valid Base64
		if (!base64Pattern.test(content)) {
			// tests if content is in base64 format, if not throw InsightError
			return Promise.reject(new InsightError("Content not in base64 format"));
		}

		// add to data structure
		// store dataset in disk !!!

		// try {
		// 	await this.saveDatasetToDisk(id);
		// } catch (_err) {
		// 	return Promise.reject(new InsightError("Error saving dataset to disk"));
		// }
		await this.saveDatasetToDisk(id);

		// return a string array containing the ids of all currently added datasets upon a successful add
		return Promise.resolve([]); //stub
	}

	public async removeDataset(id: string): Promise<string> {
		// id checking
		if (id.trim().length === 0 || id.includes("_") || this.datasets.has(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		// removing dataset
		const filePath = `../../data/${id}.json`;
		try {
			await fsPromises.unlink(filePath);
			return id;
		} catch (err) {
			return Promise.reject(new InsightError(`Error: ${err}`));
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		throw new Error(`InsightFacadeImpl::listDatasets() is unimplemented!;`);
	}

	// saves newly added dataset to disk
	// assumes that the dataset corresponding to the id is already in the datasets map
	private async saveDatasetToDisk(id: string): Promise<void> {
		const newDataset = this.datasets.get(id);
		const file = "../../data/" + id + ".json";
		await fs.writeJSON(file, newDataset); // could throw error (catches in addDataset)
	}

	// loads dataset from disk
	// assumes that id is valid and corresponds to an existing dataset
	private async loadDatasetFromDisk(id: string): Promise<void> {
		const file = "../../data/" + id + ".json";
		const dataset = await fs.readJSON(file); // could throw error
		this.datasets.set(id, dataset);
	}

	JSZip = require('jszip');
	// Function to validate section data
	private async validateSectionData(sectionData: SectionData) {
		return new Promise((resolve, reject) => {
			const requiredFields = ['id', 'Title', 'Professor', 'Subject', 'Year', 'Avg', 'Pass', 'Fail', 'Audit'];

			for (let field of requiredFields) {
				if (!(field in sectionData)) {
					console.warn(`Missing required field: ${field} in section: ${JSON.stringify(sectionData)}`);
					reject(new Error(`Validation failed: Missing field - ${field}`)); // Reject the promise if validation fails
					return;
				}
			}

			resolve(true); // Resolve the promise if validation succeeds
		});
	}



	// Function to process the zip file using Promises
	private async processZip(zipFilePath: string, name: string): Promise<Dataset> {
		const dataset = new Dataset(name);

		try {
			const data = await fs.readFile(zipFilePath);  // Read the zip file as binary data
			const zip = await JSZip.loadAsync(data);      // Load zip asynchronously

			const filePromises = Object.keys(zip.files).map(async (filename: string) => {
				const courseName = filename.split('.')[0]; // Assuming filename as course name
				const course = new Course(courseName);

				const fileData = await zip.files[filename].async('string'); // Read file content as string
			    const jsonData: SectionData[] = JSON.parse(fileData).result; // Assuming 'result' is an array of sections

				// Create an array of section promises to handle async validation
				const sectionPromises = jsonData.map(async (sectionn: SectionData) => {
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
						Audit: audit
					} = sectionn;

					try {
						// Validate the section data asynchronously
						await this.validateSectionData(sectionn);

						// Create the section object if validation passes
						const section = new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
						course.addSection(section);
					} catch (err) {
						console.warn(`Skipping invalid section: ${JSON.stringify(sectionn)} - ${(err as Error).message}`);
					}
				});

				// Wait for all section validations to complete
				await Promise.all(sectionPromises);
				dataset.addCourse(course);
			});

			await Promise.all(filePromises); // Wait for all files to be processed
		} catch (err) {
			throw new Error(`Error processing zip file: ${(err as Error).message}`);
		}

		return dataset;
	}
}






