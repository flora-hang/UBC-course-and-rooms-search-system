import SectionsDataset from "../models/sections/SectionsDataset";
import Section from "../models/sections/Section";
import Course from "../models/sections/Course";
import SectionData from "../models/sections/SectionData";
import Building from "../models/rooms/Building";
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
import { filterSections, sortResults, selectColumns, checkIds } from "./PerformQueryHelpers";
import * as fsPromises from "fs/promises";
import fs from "fs-extra";
import JSZip from "jszip";
import Query from "../models/query/Query";
import { Dataset } from "../models/Dataset";
import RoomsDataset from "../models/rooms/RoomsDataset";
import parse5 from "parse5";
// import { json } from "stream/consumers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
interface Node {
    nodeName: string;
    tagName?: string;
    childNodes?: Node[];
    value?: string;
}

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
		
		return Promise.reject(new InsightError("Not yet implemented"));
	}
	// Decode the base64 zip file and parse HTML for buildings and rooms
/**
 * Parses and extracts room data from campus.zip and populates the RoomsDataset.
 * @param zipContent - Base64 encoded zip file content.
 * @param datasetId - The ID for the RoomsDataset.
 * @returns A RoomsDataset populated with Building and Room data.
 */
private async extractRoomData(zipContent: string, datasetId: string): Promise<RoomsDataset> {
    const zip = await JSZip.loadAsync(Buffer.from(zipContent, 'base64'));
    const dataset = new RoomsDataset(datasetId);

    // Step 1: Parse the index.htm file for building information
    const indexFile = zip.file('index.htm');
    if (!indexFile) throw new Error("Error: index.htm not found in zip file.");

    const indexContent = await indexFile.async('text');
    const document = parse5.parse(indexContent);

    // Step 2: Find the building table in index.htm
    const buildings = await this.parseBuildingTable(document, zip);
    dataset.addBuildings(buildings);

    return dataset;
}

// Helper function to find the building table and extract building information.
private async parseBuildingTable(document: any, zip: JSZip): Promise<Building[]> {
    const buildings: Building[] = [];
    const buildingTable = this.findTableWithClass(document, 'views-field-title');

    if (!buildingTable) {
        throw new Error("Error: Could not find building table in index.htm.");
    }

    // Traverse rows in the building table
    for (const row of this.findAllElements(buildingTable, 'tr')) {
        const titleCell = this.findElementWithClass(row, 'views-field-title');
        const addressCell = this.findElementWithClass(row, 'views-field-field-building-address');
        const link = this.findLinkElement(titleCell);

        if (link) {
            const shortname = this.getTextContent(titleCell);
            const fullname = this.getTextContent(link);
            const address = this.getTextContent(addressCell);
            const building = new Building(fullname, shortname, address);

            const buildingFile = zip.file(link.attrs.href);
            if (buildingFile) {
                const buildingContent = await buildingFile.async('text');
                this.parseRoomTable(building, parse5.parse(buildingContent));
            }

            if (building.hasValidRoom()) {
                buildings.push(building);
            }
        }
    }

    return buildings;
}

// Helper function to parse the room table for a given building.
private parseRoomTable(building: Building, document: any): void {
    const roomTable = this.findTableWithClass(document, 'views-field-room-number');
    if (!roomTable) return;

    for (const row of this.findAllElements(roomTable, 'tr')) {
        const roomNumber = this.getTextContent(this.findElementWithClass(row, 'views-field-room-number'));
        const seatsText = this.getTextContent(this.findElementWithClass(row, 'views-field-room-capacity'));
        const seats = parseInt(seatsText, 10) || 0;
        const type = this.getTextContent(this.findElementWithClass(row, 'views-field-room-type'));
        const furniture = this.getTextContent(this.findElementWithClass(row, 'views-field-room-furniture'));
        const link = this.findLinkElement(row)?.attrs.href || '';

        if (roomNumber) {
            const room = new Room(building.getShortname(), roomNumber, seats, type, furniture, link);
            building.addRoom(room);
        }
    }
}

// Utility function to find a table by looking for a specific class on any <td> element within the table.
private findTableWithClass(root: any, className: string): any {
    for (const table of this.findAllElements(root, 'table')) {
        if (this.findElementWithClass(table, className)) {
            return table;
        }
    }
    return null;
}

// Utility to get the text content of an HTML element
private getTextContent(element: any): string {
    return element?.childNodes?.[0]?.value?.trim() || '';
}

// Helper to find a specific element with a class name.
private findElementWithClass(root: any, className: string): any {
    return this.findAllElements(root, 'td').find((td) =>
        td.attrs?.some((attr: any) => attr.name === 'class' && attr.value.includes(className))
    );
}

// Helper to find all elements of a certain tag
private findAllElements(root: any, tagName: string): any[] {
    const elements: any[] = [];
    const stack = [root];
    while (stack.length) {
        const node = stack.pop();
        if (node.tagName === tagName) elements.push(node);
        stack.push(...(node.childNodes || []));
    }
    return elements;
}

// Helper to find a link element within a cell
private findLinkElement(cell: any): any {
    return cell && this.findAllElements(cell, 'a').find((a) => a.attrs.some((attr: any) => attr.name === 'href'));
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

		if (dataset.getKind() === InsightDatasetKind.Sections) {
			return await this.querySectionsDataset(validQuery, dataset as SectionsDataset);
		} else {
			// query RoomsDataset
			return await this.queryRoomsDataset(validQuery, dataset as RoomsDataset);
		}
	}

	private async queryRoomsDataset(validQuery: Query, dataset: RoomsDataset): Promise<InsightResult[]> {
		return Promise.reject(new InsightError("Not yet implemented"));
		// TODO: Implement this method
	}

	private async querySectionsDataset(validQuery: Query, dataset: SectionsDataset): Promise<InsightResult[]> {
		const id = dataset.getId();
		const filteredSections = filterSections(validQuery.WHERE.filter, dataset.getSections(), id);

		const maxSections = 5000;
		// - check if filtered sections exceed 5000 sections limit
		if (filteredSections.length > maxSections) {
			throw new ResultTooLargeError("sections[] exceed size of 5000");
		}

		// // Parse OPTIONS block: Extract columns and order field
		const columns = validQuery.OPTIONS.columns;
		const orderField = validQuery.OPTIONS.sort?.anyKey;

		// Sort the filtered results if ORDER is specified, otherwise leave as is
		const sortedSections = orderField ? sortResults(filteredSections, orderField, columns) : filteredSections;

		// // Select the required columns
		const finalResults: InsightResult[] = selectColumns(sortedSections, columns);
		return finalResults;
	}
}
