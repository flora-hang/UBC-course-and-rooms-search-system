import Room from "./Room";
import { get } from "http";

interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export default class Building {
    private readonly fullname: string; // Full building name
    private readonly shortname: string; // Short building name
    private readonly address: string; // The building address
    public lat: number; // The latitude of the building
    public lon: number; // The longitude of the building
    private rooms: Room[];

    constructor(fullname: string, shortname: string, address: string) {
        this.fullname = fullname;
        this.shortname = shortname;
        this.address = address;
        this.rooms = [];
        this.lat = -1;
        this.lon = -1;
    }

    public addRoom(room: Room): void {
        this.rooms.push(room);
    }

    public hasValidRoom(): boolean {
        return this.rooms.length > 0;
    }

    


    public async getLatLon(): Promise<number[]> {
        const addressURL = encodeURIComponent(this.address);
        const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team142/" + addressURL;
        return new Promise((resolve, reject) => {
            get(url, (response) => {
                let data = '';

                // A chunk of data has been received.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Parse the result.
                response.on('end', () => {
                    try {
                        const geoResponse: GeoResponse = JSON.parse(data);
                        if (geoResponse.error) {
                            this.lon = -1;
                            this.lat = -1;
                            reject();
                        } else if (geoResponse.lat !== undefined && geoResponse.lon !== undefined) {
                            this.lon = geoResponse.lon;
                            this.lat = geoResponse.lat;
                            resolve([geoResponse.lat, geoResponse.lon]);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });

            }).on("error", (err) => {
                reject(err);
            });
        });

        // const response = await fetch(url);
        // if (!response.ok) {
        //     return Promise.reject("Error: No response when fetch geolocation for building " + this.shortname);
        // }
        // const responseJson: GeoResponse = await response.json();
        // if (responseJson.lat && responseJson.lon) {
        //     this.lat = responseJson.lat;
        //     this.lon = responseJson.lon;
        //     return Promise.resolve([responseJson.lat, responseJson.lon]);
        // } else {
            // return Promise.reject("Error: Could not get latitude and longitude for building " );
        // }
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