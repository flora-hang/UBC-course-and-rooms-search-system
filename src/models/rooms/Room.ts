import { InsightError } from "../../controller/IInsightFacade";
import Item from "../query/Item";

export default class Room extends Item {
	private readonly fullname: string; // Full building name
	private readonly shortname: string; // Short building name
	private readonly number: string; // The room number, not always a number so represented as a string
	private readonly name: string; // The room id, should be rooms_shortname + "_" + rooms_number
	private readonly seats: number; // The number of seats in the room
	private readonly type: string; // The room type
	private readonly furniture: string; // The room furniture
	private readonly href: string; // The link to the full details online
	private readonly lat: number; //
	private readonly lon: number; //
	private readonly address: string;

	constructor(
		fullname: string,
		shortname: string,
		roomNumber: string,
		numSeats: number,
		roomType: string,
		roomFurniture: string,
		link: string,
		lat: number,
		lon: number,
		address: string
	) {
		super();
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = roomNumber;
		this.name = shortname + "_" + roomNumber;
		this.seats = numSeats;
		this.type = roomType;
		this.furniture = roomFurniture;
		this.href = link;
		this.lat = lat;
		this.lon = lon;
		this.address = address;
	}

	public getField(comparisonField: string): any {
		switch (comparisonField) {
			case "fullname":
				return this.getFullname();
			case "shortname":
				return this.getShortname();
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
			case "lat":
				return this.getLat();
			case "lon":
				return this.getLon();
			case "address":
				return this.getAddress();
			default:
				throw new InsightError("Called getField() with an invalid comparisonField arg.");
		}
	}

	public getUniqueIdentifier(): string {
		return this.getName();
	}

	public getFullname(): string {
		return this.fullname;
	}

	public getShortname(): string {
		return this.shortname;
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

	public getLat(): number {
		return this.lat;
	}

	public getLon(): number {
		return this.lon;
	}

	public getAddress(): string {
		return this.address;
	}
}
