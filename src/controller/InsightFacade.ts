import Dataset from "../models/Dataset";
import Section from "../models/Section";
import Course from "../models/Course";
import SectionData from "../models/SectionData";
import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError } from "./IInsightFacade";
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
		// might not need constructor
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
		const base64Pattern = /^(?:[A-Z0-9+/]{4})*([A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i; // Regular expression to check if the string is valid Base64
		if (!base64Pattern.test(content)) {
			// tests if content is in base64 format, if not throw InsightError
			return Promise.reject(new InsightError("Content not in base64 format"));
		}
		// let dataset: Dataset = new Dataset(id);
		// this.processZip(content, id, dataset);
		const dataset: Dataset = await this.processZip(id, content);

		const total: number = dataset.getTotalSections();
		const insight: InsightDataset = { id: id, numRows: total, kind: kind };
		this.datasets.set(id, [dataset, insight]);

		await this.saveDatasetToDisk(id); // need try catch?

		// return a string array containing the ids of all currently added datasets upon a successful add
		return Array.from(this.datasets.keys());
		// map might not have all the keys!!!
	}

	public async removeDataset(id: string): Promise<string> {
		// id checking
		if (id.trim().length === 0 || id.includes("_") || this.datasets.has(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		// removing dataset
		const filePath = this.dataDir + `/${id}.json`;
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

	private async handleSections(course: Course, jsonData: SectionData[]): Promise<boolean> {
		let flag = false;

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
				Audit: audit,
			} = sectionn;

			// if sectionn is valid, then add the section
			if (this.validateSectionData(sectionn)) {
				// Create the section object if validation passes
				const section = new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
				course.addSection(section);
				flag = true;
			}
		});

		await Promise.all(sectionPromises);
		return flag;
	}

	// Function to process the zip file using Promises
	private async processZip(id: string, content: string): Promise<Dataset> {
		let validSection = false; // seeing if at least one section is valid
		const dataset = new Dataset(id);

		try {
			// var zip = fs.readFile(content, function(err, data) {
			// if (err) throw err;
			// return JSZip.loadAsync(data);
			// });
			// const zip = await JSZip.loadAsync(content); // Load zip asynchronously
			const data = await fs.readFile(content);
			const zip = await JSZip.loadAsync(data);
			// iterating through courses in dataset
			const filePromises = Object.keys(zip.files).map(async (filename: string) => {
				const courseName = filename.split(".")[0]; // Assuming filename as course name
				const course = new Course(courseName);

				const fileData = await zip.files[filename].async("string"); // Read file content as string
				const jsonData: SectionData[] = JSON.parse(fileData).result; // Assuming 'result' is an array of sections

				// Create an array of section promises to handle async validation
				validSection = await this.handleSections(course, jsonData);

				// Wait for all section validations to complete
				dataset.addCourse(course);
			});
			await Promise.all(filePromises); // Wait for all files to be processed
		} catch (err) {
			throw new InsightError(`Error processing zip file: ${(err as Error).message}`);
		}

		if (!validSection) {
			return Promise.reject(new InsightError("No valid sections"));
		}
		return dataset;
	}
}
