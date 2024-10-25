import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import Building from "../../src/models/rooms/Building";

use(chaiAsPromised);

describe("Building", function () {
	it("test functionality of getLat() and getLon()", async function () {
		const expectedLat = 49.26125;
		const expectedLon = -123.24807;
		const building = new Building("building1", "b1", "6245 Agronomy Road V6T 1Z4");
		const latResult = await building.getLat();
		expect(latResult).to.equal(expectedLat);
		const lonResult = await building.getLon();
		expect(lonResult).to.equal(expectedLon);
	});
});
