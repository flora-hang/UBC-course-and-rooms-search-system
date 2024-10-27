export default class Room {
    private readonly number: string; // The room number, not always a number so represented as a string
    private readonly name: string; // The room id, should be rooms_shortname + "_" + rooms_number
    private readonly seats: number; // The number of seats in the room
    private readonly type: string; // The room type
    private readonly furniture: string; // The room furniture
    private readonly href: string; // The link to the full details online

    constructor(building: string, roomNumber: string, numSeats: number,
        roomType: string, roomFurniture: string, link: string) {
        this.number = roomNumber;
        this.name = building + "_" + roomNumber;
        this.seats = numSeats;
        this.type = roomType;
        this.furniture = roomFurniture;
        this.href = link;
    }

    public getField(comparisonField: string): any {
        switch (comparisonField) {
            case "number":
                return this.getNumber();
            case "name":
                return this.getName();
            case "seats":
                return this.getSeats();
            case "type":
                return this.getType();
            case "furniture":
                return this.getFurniture();
            case "href":
                return this.getHref();
            default:
                throw new Error("Error: Called getField() with an invalid comparisonField arg.");
        }
    }

	public getUniqueIdentifier(): string {
		return this.getName();
	}

    public getNumber(): string {
        return this.number;
    }

    public getName(): string {
        return this.name;
    }

    public getSeats(): number {
        return this.seats;
    }

    public getType(): string {
        return this.type;
    }

    public getFurniture(): string {
        return this.furniture;
    }

    public getHref(): string {
        return this.href;
    }
}
