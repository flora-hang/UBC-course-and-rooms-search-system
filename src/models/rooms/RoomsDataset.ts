import { InsightDataset, InsightDatasetKind } from "../../controller/IInsightFacade";
import { Dataset } from "../Dataset";
import Building from "./Building";
import Room from "./Room";

export default class RoomsDataset extends Dataset {
	private readonly id: string;
	private kind: InsightDatasetKind = InsightDatasetKind.Rooms;
	// private buildings: Building[];
	private rooms: Room[];

	constructor(id: string) {
		super();
		this.id = id;
		// this.buildings = [];
		this.rooms = [];
	}

	// public addBuildings(buildings: Building[]): void {
	// 	this.buildings = buildings;
	// }

	public getId(): string {
		return this.id;
	}

	public getKind(): InsightDatasetKind {
		return this.kind;
	}

	public getTotalRooms(): number {
		// let total = 0;
		// this.buildings.forEach((building) => (total += building.getNumRooms()));
		// return total;
		return this.rooms.length;
	}

	// public getBuildings(): Building[] {
	// 	return this.buildings;
	// }

	public getRooms(): Room[] {
		// let rooms: Room[] = [];
		// for (const building of this.buildings) {
		// 	rooms = rooms.concat(building.getRooms());
		// }
		// return rooms;
		return this.rooms;
	}

	public getInsight(): InsightDataset {
		return {
			id: this.id,
			kind: InsightDatasetKind.Rooms,
			numRows: this.getTotalRooms(),
		};
	}

	public setKind(kind: InsightDatasetKind): void {
		this.kind = kind;
	}

	public getItems(): Room[] {
		return this.getRooms();
	}

	public setItems(items: any[]): void {
		this.rooms = items;
	}
}
