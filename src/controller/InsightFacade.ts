import SectionsDataset from "../models/sections/SectionsDataset";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
} from "./IInsightFacade";
// -------- dataset helpers ----------
import { processZip } from "./datasetHelpers";
// -------- perform query helpers ----------
import { queryItemsDataset } from "./performQueryHelpers/higherLevelHelpers";
import { checkIds } from "./performQueryHelpers/filterHelpers";
import { extractRoomData } from "./addDatasetHelper";
// ----------------------------------------
import * as fsPromises from "fs/promises";
import fs from "fs-extra";
import Query from "../models/query/Query";
import { Dataset } from "../models/Dataset";
import RoomsDataset from "../models/rooms/RoomsDataset";
import Section from "../models/sections/Section";
import Room from "../models/rooms/Room";

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

		await this.saveDatasetToDisk(id, dataset);
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

		const dataset: SectionsDataset = await processZip(id, content);
		this.datas.set(id, dataset);
		const insight = dataset.getInsight();
		this.insights.set(id, insight);

		await this.saveDatasetToDisk(id, dataset);
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
	// private async saveDatasetToDisk(id: string): Promise<void> {
	// 	const newDataset = this.datas.get(id);
	// 	const file = this.dataDir + "/" + id + ".json";
	// 	await fs.ensureDir(this.dataDir);
	// 	await fs.writeJSON(file, newDataset);
	// 	console.log("> Saved dataset: ", newDataset);
	// }

	// // loads dataset from disk
	// // assumes that id is valid and corresponds to an existing dataset
	// private async loadDatasetFromDisk(id: string): Promise<Dataset> {
	// 	const file = this.dataDir + "/" + id + ".json";
	// 	const dataset: Dataset = await fs.readJSON(file);
	// 	console.log("> Loaded dataset: ", dataset);
	// 	return dataset;
	// }

	private async saveDatasetToDisk(id: string, dataset: Dataset): Promise<void> {
		const file = this.dataDir + "/" + id + ".json";
		await fs.ensureDir(this.dataDir);
		const serializedDataset = this.serializeDataset(dataset);
		await fs.writeJSON(file, serializedDataset);
		// console.log("> Saved dataset: ", serializedDataset);
	}

	private async loadDatasetFromDisk(id: string): Promise<Dataset> {
		const file = this.dataDir + "/" + id + ".json";
		const serializedDataset = await fs.readJSON(file);
		const dataset = this.deserializeDataset(serializedDataset);
		// console.log("> Loaded dataset: ", dataset);
		return dataset;
	}

	private serializeDataset(dataset: Dataset): any {
		return {
			id: dataset.getId(),
			kind: dataset.getKind(),
			items: dataset.getItems(),
			className: dataset.constructor.name,
		};
	}

	private deserializeDataset(serialized: any): Dataset {
		const { id, kind, items, className } = serialized;
		let dataset: Dataset;

		switch (className) {
			case "SectionsDataset": {
				dataset = this.buildSectionsDataset(id, kind, items);
				break;
			}
			case "RoomsDataset": {
				dataset = this.buildRoomsDataset(id, kind, items);
				break;
			}
			default:
				throw new Error("Unknown dataset class");
		}
		return dataset;
	}

	private buildRoomsDataset(id: any, kind: any, items: any): RoomsDataset {
		const dataset = new RoomsDataset(id);
		dataset.setKind(kind);
		const restoredRooms = items.map(
			(item: any) =>
				new Room(
					item.fullname,
					item.shortname,
					item.number,
					item.seats,
					item.type,
					item.furniture,
					item.href,
					item.lat,
					item.lon,
					item.address
				)
		);
		dataset.setItems(restoredRooms);
		return dataset;
	}

	private buildSectionsDataset(id: any, kind: any, items: any): SectionsDataset {
		const dataset = new SectionsDataset(id);
		dataset.setKind(kind);
		const restoredSections = items.map(
			(item: any) =>
				new Section(
					item.uuid,
					item.id,
					item.title,
					item.instructor,
					item.dept,
					item.year,
					item.avg,
					item.pass,
					item.fail,
					item.audit
				)
		);
		dataset.setItems(restoredSections);
		return dataset;
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

		let id = checkIds(validQuery);
		// id could be undefined if columns only contain APPLY keys

		// but if id = undefined, then there exist GROUP
		if (id === undefined && validQuery.TRANSFORMATIONS) {
			id = validQuery.TRANSFORMATIONS?.group[0].split("_")[0];
		} else if (id === undefined || typeof validQuery.TRANSFORMATIONS === "string") {
			return Promise.reject(new InsightError("Invalid query"));
		}

		// console.log("> id: ", id);
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
		// console.log("> before calling this.queryItemsDataset");
		return await queryItemsDataset(validQuery, dataset as SectionsDataset | RoomsDataset);
	}
}
