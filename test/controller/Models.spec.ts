// import { expect, use } from "chai";
// import chaiAsPromised from "chai-as-promised";
// import Building from "../../src/models/rooms/Building";
// import { loadTestQuery } from "../TestUtil";
// import Query from "../../src/models/query/Query";
// import ApplyRule, { ApplyToken } from "../../src/models/query/ApplyRule";

// use(chaiAsPromised);

// describe("Building", function () {
// 	it("test functionality of getLat() and getLon()", async function () {
// 		const expectedLat = 49.26125;
// 		const expectedLon = -123.24807;
// 		const building = new Building("building1", "b1", "6245 Agronomy Road V6T 1Z4");
// 		const latResult = await building.getLat();
// 		expect(latResult).to.equal(expectedLat);
// 		const lonResult = await building.getLon();
// 		expect(lonResult).to.equal(expectedLon);
// 	});
// });

// describe("Query", function () {
// 	it("test query models", async function () {
// 		const expectedColumns: string[] = ["sections_title", "overallAvg"];
// 		const expectedGroup: string[] = ["sections_title"];
// 		const expectedApply: ApplyRule[] = [new ApplyRule("overallAvg", ApplyToken.AVG, "sections_avg")];
// 		const { input } = await loadTestQuery("[valid/simpleQueryTransformations.json]");

// 		const query = Query.buildQuery(input);
// 		expect(query.OPTIONS.columns).to.deep.equal(expectedColumns);
// 		expect(query.TRANSFORMATIONS?.GROUP).to.deep.equal(expectedGroup);
// 		expect(query.TRANSFORMATIONS?.APPLY).to.deep.equal(expectedApply);
// 	});
// });
