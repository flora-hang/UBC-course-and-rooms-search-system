import SectionsDataset from "../models/sections/SectionsDataset";
import Section from "../models/sections/Section";
import Item from "../models/query/Item";
import Course from "../models/sections/Course";
import SectionData from "../models/sections/SectionData";

import Room from "../models/rooms/Room";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {
	filterItems,
	sortResultsGroup,
	selectColumns,
	checkIds,
	groupItems,
	applyFunctionItems,
	combine,
	combine2,
	returnResults,
	sortResults,
} from "./PerformQueryHelpers";
import { extractRoomData } from "./addDatasetHelper";
import * as fsPromises from "fs/promises";
import fs from "fs-extra";
import JSZip from "jszip";
import Query from "../models/query/Query";
import { Dataset } from "../models/Dataset";
import RoomsDataset from "../models/rooms/RoomsDataset";
import ApplyRule from "../models/query/ApplyRule";

// import { json } from "stream/consumers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private dataDir = "./data/datasets";
	private insightFile = "./data/insights.json";
	private insights: Map<string, InsightDataset> = new Map<string, InsightDataset>();
	// private datas: Map<string, SectionsDataset> = new Map<string, SectionsDataset>();
	private datas: Map<string, Dataset> = new Map<string, Dataset>();

	// load insights from disk (only load id and InsightDataset, set Dataset to null)
	private async loadInsights(): Promise<void> {
		try {
			const insights = await fs.readJSON(this.insightFile);
			this.insights = new Map<string, InsightDataset>(Object.entries(insights));
		} catch (_err) {
			this.insights = new Map<string, InsightDataset>();
		}
	}

	private async saveInsights(): Promise<void> {
		await fs.ensureDir("./data");
		const insightObject = Object.fromEntries(this.insights);
		await fs.writeJSON(this.insightFile, insightObject);
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		await this.loadInsights();

		// id validation: (reject with InsightError if invalid)
		// - one of more of any character, except underscore
		// - id with only whitespace is invalid
		// - same id as an already added dataset is invalid
		if (id.trim().length === 0 || id.includes("_") || this.insights.has(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		// kind validation:
		// - Sections or Rooms
		if (kind === InsightDatasetKind.Sections) {
			return this.addSectionsDataset(id, content);
		} else if (kind === InsightDatasetKind.Rooms) {
			return this.addRoomsDataset(id, content);
		} else {
			return Promise.reject(new InsightError("Invalid kind"));
		}
	}

	private async addRoomsDataset(id: string, content: string): Promise<string[]> {
		// TODO: Implement this method
		const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

		// Test against the regex
		if (!base64Regex.test(content)) {
			return Promise.reject(new InsightError("Content not in base64 format"));
		}
		// console.log("7");
		const dataset: RoomsDataset = await extractRoomData(content, id);
		if (dataset.getTotalRooms() === 0) {
			throw new InsightError("no valid rooms in dataset");
		}
		this.datas.set(id, dataset);
		const insight = dataset.getInsight();
		this.insights.set(id, insight);

		await this.saveDatasetToDisk(id);
		await this.saveInsights();

		// return a string array containing the ids of all currently added datasets upon a successful add
		return Array.from(this.insights.keys());
	}

	private async addSectionsDataset(id: string, content: string): Promise<string[]> {
		// parse & validate content (async)
		const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

		// Test against the regex
		if (!base64Regex.test(content)) {
			return Promise.reject(new InsightError("Content not in base64 format"));
		}

		const dataset: SectionsDataset = await this.processZip(id, content);
		this.datas.set(id, dataset);
		const insight = dataset.getInsight();
		this.insights.set(id, insight);

		await this.saveDatasetToDisk(id);
		await this.saveInsights();

		// return a string array containing the ids of all currently added datasets upon a successful add
		return Array.from(this.insights.keys());
	}

	public async removeDataset(id: string): Promise<string> {
		await this.loadInsights();

		// id checking
		if (id.trim().length === 0 || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}

		// console.log("remove: insights: ", this.insights);
		if (!this.insights.has(id)) {
			return Promise.reject(new NotFoundError("Dataset not found: " + id));
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
		await this.loadInsights();
		return Array.from(this.insights.values());
	}

	// saves newly added dataset to disk
	// assumes that the dataset corresponding to the id is already in the datasets map
	private async saveDatasetToDisk(id: string): Promise<void> {
		const newDataset = this.datas.get(id);
		const file = this.dataDir + "/" + id + ".json";
		await fs.ensureDir(this.dataDir);
		await fs.writeJSON(file, newDataset);
	}

	// loads dataset from disk
	// assumes that id is valid and corresponds to an existing dataset
	private async loadDatasetFromDisk(id: string): Promise<Dataset> {
		const file = this.dataDir + "/" + id + ".json";
		const dataset: Dataset = await fs.readJSON(file);
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
			}
		});
		return course;
	}

	// Function to process the zip file using Promises
	private async processZip(id: string, content: string): Promise<SectionsDataset> {
		const dataset = new SectionsDataset(id);

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
			dataset.addCourses(courseArray);
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

		const id = checkIds(validQuery);
		if (!this.insights.has(id)) {
			throw new InsightError("Querying section that has not been added");
		}
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
		console.log("> before calling this.queryItemsDataset");
		return await this.queryItemsDataset(validQuery, dataset as SectionsDataset | RoomsDataset);
	}

	private async queryItemsDataset(
		validQuery: Query,
		dataset: SectionsDataset | RoomsDataset
	): Promise<InsightResult[]> {
		let finalResults: InsightResult[] = [];

		const id = dataset.getId();

		let items: Item[] = null as unknown as Item[];
		if (dataset instanceof SectionsDataset) {
			items = dataset.getSections();
		} else if (dataset instanceof RoomsDataset) {
			items = dataset.getRooms();
		}
		// console.log("!!! START OF FILTER ITEMS FUNC");
		const filteredItems = filterItems(validQuery.WHERE.filter, items, id) as Item[];
		// console.log("> filtered items", filteredItems);
		// console.log("!!! START OF OIPTIONS BLOCK PARSE");
		// Parse OPTIONS block: Extract columns and order field
		const columns = validQuery.OPTIONS.columns;
		// const orderField = validQuery.OPTIONS.sort?.anyKey
		// 	? validQuery.OPTIONS.sort?.anyKey
		// 	: validQuery.OPTIONS.sort?.dir && validQuery.OPTIONS.sort?.keys
		// 	? { dir: validQuery.OPTIONS.sort?.dir, keys: validQuery.OPTIONS.sort?.keys }
		// 	: null;
		const orderField = validQuery.OPTIONS.sort;
		// console.log("!!! END OF OPTIONS BLOCK PARSE");
		if (!validQuery.OPTIONS.sort?.anyKey && !!validQuery.OPTIONS.sort?.dir !== !!validQuery.OPTIONS.sort?.keys) {
			throw new InsightError("Order is incorrect");
		}

		// Parse TRANSFORMATIONS block: Extract group and apply field
		let groups: string[];
		let applyRules: ApplyRule[];

		if (validQuery.TRANSFORMATIONS) {
			groups = validQuery.TRANSFORMATIONS?.group;
			applyRules = validQuery.TRANSFORMATIONS?.apply;

			// check that all COLUMNS keys must correspond to one of the GROUP keys or to applykeys
			const applyKeys = applyRules.map((applyRule) => applyRule.applyKey);
			const allValidKeys = new Set([...groups, ...applyKeys]);
			columns.forEach((column) => {
				if (!allValidKeys.has(column)) {
					throw new InsightError("COLUMNS keys must correspond to one of the GROUP keys or to applykeys");
				}
			});

			const seen = new Set<string>(); // seen apply keys
			applyRules?.forEach((applyRule) => {
				// console.log(seen);
				// console.log("b", applyRule.applyKey);
				if (seen.has(applyRule.applyKey)) {
					throw new InsightError("APPLY contains duplicate key");
				}
				seen.add(applyRule.applyKey);
			});
			console.log("> checked for unique apply keys");

			// group the items together
			if (validQuery.TRANSFORMATIONS && !groups) {
				throw new InsightError("Transformations must have a GROUP block");
			} else if (validQuery.TRANSFORMATIONS && !applyRules) {
				throw new InsightError("Transformations must have an APPLY block");
			}
			console.log("> checked for group and apply blocks");

			// group the filtered results into specific groups
			// const groupedItems = groups ? groupItems(filteredItems, groups) : null;
			// console.log("> grouped items, size: ", groupedItems);
			// apply specified APPLYTOKENs if given
			// const applyItems = apply ? applyFunctionItems(groupedItems as (Section | Room)[][], apply) : null;
			// console.log("> grouped and applied items, size: ", applyItems);

			// const groupAndApply = combine(groupedItems, applyItems);

			const groupedItems = groupItems(filteredItems, groups, id); // give id?
			console.log("> grouped items length:", groupedItems?.length);
			const appliedItems = applyFunctionItems(groupedItems, applyRules, id);
			console.log("> applied items length:", appliedItems?.length);
			const groupAndApply = combine2(groups, groupedItems, appliedItems);
			console.log("> combined items length:", groupAndApply?.length);

			if (orderField) {
				const sortedItems = sortResultsGroup(groupAndApply, orderField, columns);
				console.log("> sorted items:", sortedItems?.length);
				finalResults = returnResults(sortedItems);
			} else {
				finalResults = returnResults(groupAndApply);
			}
		} else {
			// sort without group and apply
			if (orderField) {
				finalResults = selectColumns(sortResults(filteredItems, orderField, columns), columns);
			} else {
				finalResults = selectColumns(filteredItems, columns);
			}
		}
		// TODO: add new sort functionality
		// IF TRANSFORMATION block and SORT given: sort the group items
		// ELSE IF only SORT given and TRANSFORMATION block not given: sort the filtered items
		// ELSE: return filtered items

		// if (applyItems) {
		// 	const sortedItems = orderField
		// 		? groups && apply
		// 			? sortResults(groupAndApply, orderField as any, columns)
		// 			: sortResults(groupAndApply, orderField as any, columns)
		// 		: applyItems;

		// 	console.log("> sorted items, size: ", sortedItems);
		// 	// sortedItems is a list of list of objects: [Room{}, Room{}, {maxSeats: 100}], []

		// 	// // Select the required columns
		// 	finalResults = selectColumns(sortedItems, columns);
		// }

		const maxSections = 5000;
		// - check if filtered sections exceed 5000 sections limit
		if (finalResults.length > maxSections) {
			throw new ResultTooLargeError("results exceed size of 5000, size is: " + finalResults.length);
		}

		return finalResults;
	}
}
