import { InsightError, InsightResult } from "./IInsightFacade";
import Room from "../models/rooms/Room";
import RoomsDataset from "../models/rooms/RoomsDataset";
import JSZip from "jszip";
import parse5 from "parse5";
import Building from "../models/rooms/Building";
// Decode the base64 zip file and parse HTML for buildings and rooms
	/**
	 * Parses and extracts room data from campus.zip and populates the RoomsDataset.
	 * @param zipContent - Base64 encoded zip file content.
	 * @param datasetId - The ID for the RoomsDataset.
	 * @returns A RoomsDataset populated with Building and Room data.
	 */
	export async function extractRoomData(zipContent: string, datasetId: string): Promise<RoomsDataset> {
		const zip = await JSZip.loadAsync(Buffer.from(zipContent, "base64"));
		const dataset = new RoomsDataset(datasetId);

		// Step 1: Parse the index.htm file for building information
		const indexFile = zip.file("index.htm");
		if (!indexFile) {
			throw new Error("Error: index.htm not found in zip file.");
		}

		const indexContent = await indexFile.async("text");
		const document = parse5.parse(indexContent);

		// Step 2: Find the building table in index.htm
		const buildings = await parseBuildingTable(document, zip);
		dataset.addBuildings(buildings);

		return dataset;
	}

	// Helper function to find the building table and extract building information.
    async function parseBuildingTable(document: any, zip: JSZip): Promise<Building[]> {
		const buildings: Building[] = [];
		const buildingTable = findTableWithClass(document, "views-field-title");

		if (!buildingTable) {
			throw new InsightError("Error: Could not find building table in index.htm.");
		}

		// Traverse rows in the building table
		for (const row of findAllElements(buildingTable, "tr")) {
			const titleCell = findElementWithClass(row, "views-field-title");
			const addressCell = findElementWithClass(row, "views-field-field-building-address");
			const link = findLinkElement(titleCell);

			if (link) {
				const shortname = getTextContent(titleCell);
				const fullname = getTextContent(link);
				const address = getTextContent(addressCell);
				const building = new Building(fullname, shortname, address);

				const buildingFile = zip.file(link.attrs.href);
				if (buildingFile) {
					const buildingContent = await buildingFile.async("text");
					parseRoomTable(building, parse5.parse(buildingContent));
				}

				if (building.hasValidRoom()) {
					buildings.push(building);
				}
			}
		}

		return buildings;
	}

	// Helper function to parse the room table for a given building.
	function parseRoomTable(building: Building, document: any): void {
		const roomTable = findTableWithClass(document, "views-field-room-number");
		if (!roomTable) {
			return;
		}

		for (const row of findAllElements(roomTable, "tr")) {
			const roomNumber = getTextContent(findElementWithClass(row, "views-field-room-number"));
			const seatsText = getTextContent(findElementWithClass(row, "views-field-room-capacity"));
			const seats = parseInt(seatsText, 10) || 0;
			const type = getTextContent(findElementWithClass(row, "views-field-room-type"));
			const furniture = getTextContent(findElementWithClass(row, "views-field-room-furniture"));
			const link = findLinkElement(row)?.attrs.href || "";

			if (roomNumber) {
				const room = new Room(building.getShortname(), roomNumber, seats, type, furniture, link);
				building.addRoom(room);
			}
		}
	}

	// Utility function to find a table by looking for a specific class on any <td> element within the table.
	function findTableWithClass(root: any, className: string): any {
		for (const table of findAllElements(root, "table")) {
			if (findElementWithClass(table, className)) {
				return table;
			}
		}
		return null;
	}

	// Utility to get the text content of an HTML element
	function getTextContent(element: any): string {
		return element?.childNodes?.[0]?.value?.trim() || "";
	}

	// Helper to find a specific element with a class name.
	function findElementWithClass(root: any, className: string): any {
		return findAllElements(root, "td").find((td) =>
			td.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes(className))
		);
	}

	// Helper to find all elements of a certain tag
	function findAllElements(root: any, tagName: string): any[] {
		const elements: any[] = [];
		const stack = [root];
		while (stack.length) {
			const node = stack.pop();
			if (node.tagName === tagName) {
				elements.push(node);
			}
			stack.push(...(node.childNodes || []));
		}
		return elements;
	}

	// Helper to find a link element within a cell
	function findLinkElement(cell: any): any {
		return cell && findAllElements(cell, "a").find((a) => a.attrs.some((attr: any) => attr.name === "href"));
	}
