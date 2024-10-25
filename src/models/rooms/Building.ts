import Room from "./Room";

interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export default class Building {
    private readonly fullname: string; // Full building name
    private readonly shortname: string; // Short building name
    private readonly address: string; // The building address
    private lat?: number; // The latitude of the building
    private lon?: number; // The longitude of the building
    private rooms: Room[];

    constructor(fullname: string, shortname: string, address: string) {
        this.fullname = fullname;
        this.shortname = shortname;
        this.address = address;
        this.rooms = [];
    }

    public addRoom(room: Room): void {
        this.rooms.push(room);
    }

    public hasValidRoom(): boolean {
        return this.rooms.length > 0;
    }

    public async getLat(): Promise<number> {
        if (!this.lat) {
            const latLon = await this.getLatLon();
            this.lat = latLon[0];
        }
        if (!this.lat) {
            return Promise.reject("Error: Could not get latitude for building " + this.shortname);
        } else {
            return Promise.resolve(this.lat);   
            }
        }
    
    public async getLon(): Promise<number> {
        if (!this.lon) {
            const latLon = await this.getLatLon();
            this.lon = latLon[1];
        }
        if (!this.lon) {
            return Promise.reject("Error: Could not get longitude for building " + this.shortname);
        } else {
            return Promise.resolve(this.lon);
    }
}

    private async getLatLon(): Promise<number[]> {
        const addressURL = encodeURIComponent(this.address);
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team142/" + addressURL;
        const response = await fetch(url);
        if (!response.ok) {
            return Promise.reject("Error: No response when fetch geolocation for building " + this.shortname);
        }
        const responseJson: GeoResponse = await response.json();
        if (responseJson.lat && responseJson.lon) {
            this.lat = responseJson.lat;
            this.lon = responseJson.lon;
            return Promise.resolve([responseJson.lat, responseJson.lon]);
        } else {
            return Promise.reject("Error: Could not get latitude and longitude for building " + responseJson.error);
        }
    }

    public getFullname(): string {
        return this.fullname;
    }

    public getShortname(): string { 
        return this.shortname; 
    }

    public getAddress(): string { 
        return this.address; 
    }

    public getNumRooms(): number {
        return this.rooms.length;
    }

    public getRooms(): Room[] {
        return this.rooms;
    }
}