import Dataset from "../models/Dataset";
import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError } from "./IInsightFacade";
import * as fsPromises from "fs/promises";
import fs from "fs-extra";

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
		const cachedDatasets = await fs.readdir("../../data");
		const datasetsIdArray: string[] = Array.from(this.datasets.values()).map((tuple) => tuple[1].id);

		const loadedDatasets: Dataset[] = await Promise.all(
			cachedDatasets.map(async (dataset) => await this.loadDatasetFromDisk(dataset.replace(".json", "")))
		); // get all of the datasets from the disk in Dataset form/type

		let count = 0; // used for indexing in the loadedDatasets array

		// looping through all datasets stored on disk to store missing datasets in map
		for (const dataset of cachedDatasets) {
			const datasetId: string = dataset.replace(".json", "");

			if (!datasetsIdArray.includes(datasetId)) {
				// if the current this.datasets doesn't include a dataset found within the disk, add to this.datasets
				const loadedInsightDataset: InsightDataset = {
					// creating a InsightDataset object to later add to map
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
		const file = "../../data/" + id + ".json";
		await fs.writeJSON(file, newDataset); // could throw error (catches in addDataset)
	}

	// loads dataset from disk
	// assumes that id is valid and corresponds to an existing dataset
	private async loadDatasetFromDisk(id: string): Promise<Dataset> {
		const file = "../../data/" + id + ".json";
		const dataset: Dataset = await fs.readJSON(file); // could throw error
		// this.datasets.set(id, dataset);
		return dataset;
	}
}
