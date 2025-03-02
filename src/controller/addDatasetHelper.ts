import { InsightError } from "./IInsightFacade";
import Room from "../models/rooms/Room";
import RoomsDataset from "../models/rooms/RoomsDataset";
import JSZip from "jszip";
import * as parse5 from "parse5";
import Building from "../models/rooms/Building";
// Decode the base64 zip file and parse HTML for buildings and rooms
/**
 * Parses and extracts room data from campus.zip and populates the RoomsDataset.
 * @param zipContent - Base64 encoded zip file content.
 * @param datasetId - The ID for the RoomsDataset.
 * @returns A RoomsDataset populated with Building and Room data.
 */
export async function extractRoomData(zipContent: string, datasetId: string): Promise<RoomsDataset> {
	const Zip = new JSZip();
	const zip = await Zip.loadAsync(zipContent, { base64: true });
	const dataset = new RoomsDataset(datasetId);

	// Step 1: Parse the index.htm file for building information
	const indexFile = zip.file("index.htm");
	if (!indexFile) {
		throw new InsightError("index.htm not found in zip file.");
	}

	const indexContent = await indexFile.async("text");
	const document = parse5.parse(indexContent);

	// Step 2: Find the building table in index.htm
	const buildings = await parseBuildingTable(document, zip);
	const allRooms: Room[] = [];
	buildings.forEach((building) => {
		allRooms.push(...building.getRooms());
	});
	dataset.setItems(allRooms);

	return dataset;
}

// Helper function to find the building table and extract building information.
async function parseBuildingTable(document: any, zip: JSZip): Promise<Building[]> {
	const buildings: Building[] = [];
	const parseThis: any = [];
	const latList: any = [];

	const buildingTable = findAllElements(document, "table");
	if (!buildingTable) {
		throw new InsightError("Error: Could not find building table in index.htm.");
	}
	const buildingTableBody = findAllElements(buildingTable[0], "tbody");

	// Traverse rows in the building table
	const rows = findAllElements(buildingTableBody[0], "tr");
	parseBuildingTableRows(rows, zip, parseThis, buildings, latList);

	const array = await Promise.all(parseThis);
	await Promise.allSettled(latList);
	buildings.filter((building) => building.lat !== -1 && building.lon !== -1);
	let i = 0;
	const promises = [];
	for (const buildingContent of array) {
		promises.push(parseRoomTable(buildings[i], parse5.parse(buildingContent)));
		i++;
	}
	await Promise.all(promises);
	return buildings;
}

function parseBuildingTableRows(rows: any[], zip: JSZip, parseThis: any, buildings: Building[], LatList: any): void {
	for (const row of rows) {
		const columns = findAllElements(row, "td");
		if (!columns || columns.length === 0) {
			continue;
		}

		const codeCell = findElementWithClass(columns, "views-field-field-building-code");
		// const titleCell = findElementWithClass(columns, "views-field-title");
		const addressCell = findElementWithClass(columns, "views-field-field-building-address");
		const link = findLinkElement(findElementWithClass(columns, "views-field-title"));
		individualRows(codeCell, addressCell, link, zip, LatList, buildings, parseThis);
	}
}
function individualRows(
	codeCell: any,
	addressCell: any,
	link: any,
	zip: JSZip,
	LatList: any,
	buildings: any,
	parseThis: any
): void {
	if (link) {
		// const shortname = getTextContent(codeCell);
		// const fullname = getTextContent(link);
		// const address = getTextContent(addressCell);
		// console.log("", shortname, " | ", fullname, " | ", address);
		const building = new Building(getTextContent(link), getTextContent(codeCell), getTextContent(addressCell));

		let href;
		for (const attr of link.attrs) {
			if (attr.name === "href") {
				href = attr.value;
			}
		}
		const two = 2;
		const path = href.substring(two);
		const buildingFile = zip.file(path);
		if (!buildingFile) {
			throw new InsightError("Could not find building file in zip file: " + path);
		}

		if (buildingFile) {
			LatList.push(building.getLatLon());

			parseThis.push(buildingFile.async("text"));
			buildings.push(building);
		}
	}
}
// Helper function to parse the room table for a given building.
async function parseRoomTable(building: Building, document: any): Promise<void> {
	const roomTable = findAllElements(document, "tbody");
	// console.log(" > ", building.getShortname(), ": ", roomTable.length);
	if (!roomTable || roomTable.length === 0) {
		return;
	}
	// console.log(" --- ", roomTable.length);

	const rows = findAllElements(roomTable[0], "tr");
	for (const row of rows) {
		const columns = findAllElements(row, "td");
		if (!columns || columns.length === 0) {
			continue;
		}
		// const roomNumber = getTextContent(findElementWithClass(columns, "views-field-field-room-number"));
		const roomNumber = getTextContent(findLinkElement(findElementWithClass(columns, "views-field-field-room-number")));
		const seatsText = getTextContent(findElementWithClass(columns, "views-field-field-room-capacity"));
		const seats = parseInt(seatsText, 10) || 0;
		const type = getTextContent(findElementWithClass(columns, "views-field-field-room-type"));
		const furniture = getTextContent(findElementWithClass(columns, "views-field-field-room-furniture"));
		const linkElement = findLinkElement(findElementWithClass(columns, "views-field-nothing"));
		const link = linkElement?.attrs.find((attr: any) => attr.name === "href")?.value;
		// console.log(" > ", roomNumber, " | ", seats, " | ", type, " | ", furniture, " | ", link);

		if (roomNumber) {
			const room = new Room(
				building.getFullname(),
				building.getShortname(),
				roomNumber,
				seats,
				type,
				furniture,
				link,
				building.lat,
				building.lon,
				building.getAddress()
			);
			building.addRoom(room);
		}
	}
}

// Utility to get the text content of an HTML element
function getTextContent(element: any): string {
	return element?.childNodes?.[0]?.value?.trim() || "";
}

// Helper to find a specific element with a class name.
function findElementWithClass(columns: any, className: string): any {
	// return findAllElements(root, "td").find((td) =>
	// 	td.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes(className))
	// );
	if (!columns || columns.length === 0) {
		return;
	}
	for (const column of columns) {
		const attrs = column.attrs;
		for (const attr of attrs) {
			if (attr.name === "class" && attr.value.includes(className)) {
				return column;
			}
		}
	}
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
