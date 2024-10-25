import { InsightDataset, InsightDatasetKind } from "../../controller/IInsightFacade";
import Building from "./Building";
import Room from "./Room";

export default class RoomsDataset {
    private readonly id: string;
    private buildings: Building[];

    constructor(id: string) {
        this.id = id;
        this.buildings = [];
    }

    public addBuildings(buildings: Building[]): void {
        this.buildings = buildings;
    }

    public getId(): string {
        return this.id;
    }

    public getTotalRooms(): number {
        let total = 0;
        this.buildings.forEach((building) => (total += building.getNumRooms()));
        return total;
    }

    public getBuildings(): Building[] {
        return this.buildings;
    }

    public getRooms(): Room[] {
        let rooms: Room[] = [];
        for (const building of this.buildings) {
            rooms = rooms.concat(building.getRooms());
        }
        return rooms;
    }

    public getInsight(): InsightDataset {
        return {
			id: this.id,
			kind: InsightDatasetKind.Rooms,
			numRows: this.getTotalRooms(),
		};
    }
}