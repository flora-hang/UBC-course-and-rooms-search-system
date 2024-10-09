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
	ResultTooLargeError,
} from "./IInsightFacade";
import { filterSections, sortResults, selectColumns, checkIds } from "./PerformQueryHelpers";
import * as fsPromises from "fs/promises";
import fs from "fs-extra";
import JSZip from "jszip";
import Query from "../models/query/Query";

// import { json } from "stream/consumers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// private loadedData: boolean = false;
	private dataDir = "./data/datasets";
	private insightFile = "./data/insights.json";
	private insights: Map<string, InsightDataset> = new Map<string, InsightDataset>();
	private datas: Map<string, Dataset> = new Map<string, Dataset>();
	// private datasets: Map<string, [Dataset, InsightDataset]> = new Map<string, [Dataset, InsightDataset]>();

	constructor() {
		// empty constructor
	}

	// load insights from disk (only load id and InsightDataset, set Dataset to null)
	private async loadInsights(): Promise<void> {
		try {
			const insights = await fs.readJSON(this.insightFile);
			this.insights = new Map<string, InsightDataset>(Object.entries(insights));
		} catch (_err) {
			this.insights = new Map<string, InsightDataset>();
		}
		// this.loadedData = true;
	}

	private async saveInsights(): Promise<void> {
		await fs.ensureDir("./data");
		const insightObject = Object.fromEntries(this.insights);
		await fs.writeJSON(this.insightFile, insightObject);
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// if (!this.loadedData) {
		// 	await this.loadInsights();
		// }
		await this.loadInsights();

		// id validation: (reject with InsightError if invalid)
		// - one of more of any character, except underscore
		// - id with only whitespace is invalid
		// - same id as an already added dataset is invalid
		// console.log("addDatasets > insights: ", this.insights); //
		if (id.trim().length === 0 || id.includes("_") || this.insights.has(id)) {
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
		this.datas.set(id, dataset);
		const insight = dataset.getInsight();
		this.insights.set(id, insight);

		await this.saveDatasetToDisk(id);
		await this.saveInsights();

		// return a string array containing the ids of all currently added datasets upon a successful add
		const fileNames = await fs.readdir(this.dataDir);
		const ids = fileNames.map((addedId) => addedId.replace(".json", ""));
		return ids;
	}

	public async removeDataset(id: string): Promise<string> {
		// if (!this.loadedData) {
		// 	await this.loadInsights();
		// }
		await this.loadInsights();

		// id checking
		if (id.trim().length === 0 || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		// console.log("remove: insights: ", this.insights);
		if (!this.insights.has(id)) {
			return Promise.reject(new NotFoundError("Dataset not found"));
		}

		// removing dataset
		const filePath = this.dataDir + `/${id}.json`;
		try {
			await fsPromises.unlink(filePath);

			this.datas.delete(id);
			this.insights.delete(id);
			await this.saveInsights();

			return id;
		} catch (err) {
			return Promise.reject(new InsightError(`Error: ${err}`));
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// if (!this.loadedData) {
		// 	await this.loadInsights();
		// }
		await this.loadInsights();

		return Array.from(this.insights.values());

		// const cachedDatasets = await fs.readdir(this.dataDir);
		// const datasetsIdArray: string[] = Array.from(this.datasets.values()).map((tuple) => tuple[1].id);

		// // get all of the datasets from the disk in Dataset form/type
		// const loadedDatasets: Dataset[] = await Promise.all(
		// 	cachedDatasets.map(async (dataset) => await this.loadDatasetFromDisk(dataset.replace(".json", "")))
		// );

		// let count = 0; // used for indexing in the loadedDatasets array

		// // looping through all datasets stored on disk to store missing datasets in map
		// for (const dataset of cachedDatasets) {
		// 	const datasetId: string = dataset.replace(".json", "");

		// 	// if the current this.datasets doesn't include a dataset found within the disk, add to this.datasets
		// 	if (!datasetsIdArray.includes(datasetId)) {
		// 		// creating a InsightDataset object to later add to map
		// 		const loadedInsightDataset: InsightDataset = {
		// 			id: datasetId,
		// 			kind: InsightDatasetKind.Sections,
		// 			numRows: loadedDatasets[count].getTotalSections(),
		// 		};
		// 		this.datasets.set(datasetId, [loadedDatasets[count], loadedInsightDataset]); // adding tuple of Dataset and InsightDataset to this.datasets map
		// 	}
		// 	count++;
		// }

		// return Array.from(this.datasets.values()).map((tuple) => tuple[1]); // returning list of InsightDataset
	}

	// saves newly added dataset to disk
	// assumes that the dataset corresponding to the id is already in the datasets map
	private async saveDatasetToDisk(id: string): Promise<void> {
		const newDataset = this.datas.get(id);
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
		await this.loadInsights();

		// Check if query is an object
		if (typeof query !== "object" || query === null) {
			return Promise.reject(new InsightError("Query must be an object"));
		}

		// Check if query is empty
		if (Object.keys(query).length === 0) {
			return Promise.reject(new InsightError("Query is empty"));
		}

		// Build query object
		const validQuery = Query.buildQuery(query);
		// console.log("> built query");

		const id = checkIds(validQuery);
		if (!this.insights.has(id)) {
			throw new InsightError("Querying section that has not been added");
		}
		// console.log("> checked ids");
		let dataset: Dataset;

		// if dataset is not in memory, load it from disk
		if (!this.datas.has(id)) {
			dataset = await this.loadDatasetFromDisk(id);
			this.datas.set(id, dataset);
		} else {
			const data = this.datas.get(id);
			if (!data) {
				throw new InsightError("Dataset not found");
			}
			dataset = data;
		}

		// const dataset = data[0];
		// console.log("num sections: %d\n", dataset.getTotalSections());

		// console.log("num sections: %d\n", dataset.getSections().length);
		// - filter sections (WHERE block)
		const filteredSections = filterSections(validQuery.WHERE.filter, dataset.getSections(), id);
		// console.log("num sections: %d\n", filteredSections.length);

		const maxSections = 5000;
		// - check if filtered sections exceed 5000 sections limit
		if (filteredSections.length > maxSections) {
			throw new ResultTooLargeError("sections[] exceed size of 5000");
		}
		// - make required columns (OPTIONS: COLUMNS)
		// - order results (OPTIONS: ORDER)

		// // Parse OPTIONS block: Extract columns and order field
		const columns = validQuery.OPTIONS.columns;
		const orderField = validQuery.OPTIONS.order;

		// Sort the filtered results if ORDER is specified, otherwise leave as is
		const sortedSections = orderField ? sortResults(filteredSections, orderField, columns) : filteredSections;

		// // Select the required columns
		const finalResults: InsightResult[] = selectColumns(sortedSections, columns);
		// console.log(finalResults);
		return finalResults;
	}
}
