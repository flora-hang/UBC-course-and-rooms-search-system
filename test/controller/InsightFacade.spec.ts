import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	// let fakeSections: string;
	let validDataset: string;
	let invalidDataset: string;
	let nonJSONCourseDataset: string;
	// let invalidCourseDataset: string;
	let badCoursesFolderDataset: string;
	let invalidSectionDataset: string;
	let oneValidSection: string;
	let rooms: string;
	before(async function () {
		// This block runs once and loads the datasets.
		rooms = await getContentFromArchives("campus.zip");
		sections = await getContentFromArchives("pair.zip");
		// fakeSections = await getContentFromArchives("fakepair.zip"); // has two extra sections w/ avg === 65
		validDataset = await getContentFromArchives("validDataset.zip");
		invalidDataset = await getContentFromArchives("invalidDataset.zip");
		nonJSONCourseDataset = await getContentFromArchives("nonJSONCourseDataset.zip");
		// invalidCourseDataset = await getContentFromArchives(
		// 	"invalidCourseDataset.zip"
		// ); //
		badCoursesFolderDataset = await getContentFromArchives("badCoursesFolderDataset.zip");
		invalidSectionDataset = await getContentFromArchives("invalidSectionDataset.zip");
		oneValidSection = await getContentFromArchives("oneValidSection.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	// NOTES:
	// - added datasets must be cached, ex. if user creates a new instance of InsightFacade, they should be able to
	//	 perform operations on the old datasets added previously BUT TO SIMPLIFY PROCESS: behaviour of all "old" instances
	//   is undefined. (use a class variable = memory)
	// - SIGNATURE: addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]>
	// - id: valid if type == idstring == [^_]+ (One or more of any character, except underscore)
	// - content: can be three things:
	//     - dataset:
	//		   - base64 string of a zip file
	//         - contains at least one valid section
	//     - course:
	//		   - is a JSON file
	//         - contains at least one valid section (valid sections are found within "result" key)
	//         - located within a folder called "courses/"
	//     - section:
	//         - contains every field which can be used by a query
	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("reject empty string dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError, "Invalid id");
		});

		it("reject whitespace dataset id", function () {
			const result = facade.addDataset(" ", validDataset, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError, "Invalid id");
		});

		it("reject dataset id containing an underscore", function () {
			const result = facade.addDataset("a_b", validDataset, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError), "Invalid id";
		});

		it("reject content not in the format of a base64 string", function () {
			const invalidContent = "invalid content";
			const result = facade.addDataset("invalidContent", invalidContent, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("reject content with dataset without any valid sections", function () {
			const result = facade.addDataset("invalidDataset", invalidDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("reject content with course not in JSON format", function () {
			const result = facade.addDataset("nonJSONCourseDataset", nonJSONCourseDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it('reject content with course not correctly located in a "courses" folder', function () {
			const result = facade.addDataset("badCoursesFolderDataset", badCoursesFolderDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("reject content with section not containing all fields used by query", function () {
			const result = facade.addDataset("invalidSectionDataset", invalidSectionDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should fulfill with large valid dataset (pair.zip)", async function () {
			try {
				const result = await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				expect(result.length).to.equal(1);
				expect(result[0]).to.equal("sections");
			} catch (_err) {
				// console.log(err);
				expect.fail("Should not have thrown an error.");
			}
		});
		it("should add roomsDataset (campus.zip)", async function () {
			try {
				const result = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect(result.length).to.equal(1);
				expect(result[0]).to.equal("rooms");
			} catch (_err) {
				// console.log(_err);
				expect.fail("Should not have thrown an error.");
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(async function () {
			facade = new InsightFacade();
			await facade.addDataset("validDataset", validDataset, InsightDatasetKind.Sections);
		});

		afterEach(async function () {
			await clearDisk();
		});

		it("remove a valid dataset", async function () {
			const result = await facade.removeDataset("validDataset");
			const datasets = await facade.listDatasets();
			if (datasets.length !== 0) {
				expect.fail("Dataset should be empty");
			}
			return expect(result).to.deep.equal("validDataset");
		});

		it("reject dataset id == empty string", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("reject dataset id == whitespace", function () {
			const result = facade.removeDataset(" ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("reject dataset id contains underscore", function () {
			const result = facade.removeDataset("alpha_beta");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("reject non-existent dataset id", function () {
			const result = facade.removeDataset("sections");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("remove a valid rooms dataset", async function () {
			await facade.removeDataset("validDataset");
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			const result = await facade.removeDataset("rooms");
			const datasets = await facade.listDatasets();
			if (datasets.length !== 0) {
				expect.fail("Dataset should be empty");
			}
			return expect(result).to.deep.equal("rooms");
		});
	});

	describe("ListDataset", function () {
		beforeEach(function () {
			facade = new InsightFacade();
		});

		afterEach(async function () {
			await clearDisk();
		});

		it("list all datasets", async function () {
			await facade.addDataset("validDataset", validDataset, InsightDatasetKind.Sections);

			const result = await facade.listDatasets();
			const validDataset1: InsightDataset = {
				id: "validDataset",
				kind: InsightDatasetKind.Sections,
				numRows: 2,
			};
			const expected: InsightDataset[] = [];
			expected.push(validDataset1);

			expect(result[0].id).to.equal(expected[0].id);
			expect(result[0].numRows).to.equal(expected[0].numRows);
			expect(result[0].kind).to.equal(expected[0].kind);
			return expect(result).to.deep.equal(expected);
		});
		it("list all roomdatasets", async function () {
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);

			const result = await facade.listDatasets();
			const validDataset1: InsightDataset = {
				id: "rooms",
				kind: InsightDatasetKind.Rooms,
				numRows: 364,
			};
			const expected: InsightDataset[] = [];
			expected.push(validDataset1);

			expect(result[0].id).to.equal(expected[0].id);
			expect(result[0].numRows).to.equal(expected[0].numRows);
			expect(result[0].kind).to.equal(expected[0].kind);
			return expect(result).to.deep.equal(expected);
		});
	});

	describe("cachingProgress", function () {
		afterEach(async function () {
			await clearDisk();
		});

		it("reject: facade2 should not add dataset already added by facade1", async function () {
			try {
				const facade1 = new InsightFacade();
				await facade1.addDataset("one", oneValidSection, InsightDatasetKind.Sections);
				// expect(facade1).to.equal(["one"]);
				const facade2 = new InsightFacade();
				await facade2.addDataset("one", oneValidSection, InsightDatasetKind.Sections);
				expect.fail("Should not have added the same dataset twice.");
			} catch (err) {
				// console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("fulfill: facade2 should be able to access dataset already added by facade1", async function () {
			try {
				const facade1 = new InsightFacade();
				await facade1.addDataset("one", oneValidSection, InsightDatasetKind.Sections);
				const expected = await facade1.listDatasets();
				const facade2 = new InsightFacade();
				expect(await facade2.listDatasets()).to.deep.equal(expected);
			} catch (_err) {
				// console.log(_err);
				expect.fail("Should not have thrown an error.");
			}
		});

		it("reject: facade2 should not remove dataset already removed by facade1", async function () {
			try {
				const facade1 = new InsightFacade();
				await facade1.addDataset("one", oneValidSection, InsightDatasetKind.Sections);
				// expect(facade1).to.equal(["one"]);
				await facade1.removeDataset("one");
				const facade2 = new InsightFacade();
				await facade2.removeDataset("one");
				expect.fail("Should not have removed the same dataset twice.");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("fulfill: facade2 should not list dataset already removed by facade1", async function () {
			try {
				const facade1 = new InsightFacade();
				await facade1.addDataset("one", oneValidSection, InsightDatasetKind.Sections);
				// expect(facade1).to.equal(["one"]);
				await facade1.removeDataset("one");
				const facade2 = new InsightFacade();
				const result = await facade2.listDatasets();
				expect(result.length).to.equal(0);
			} catch (_err) {
				expect.fail("Should not have thrown an error.");
			}
		});

		it("fulfill: facade2 should be able to access rooms dataset already added by facade1", async function () {
			try {
				const facade1 = new InsightFacade();
				await facade1.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				const expected = await facade1.listDatasets();
				const facade2 = new InsightFacade();
				expect(await facade2.listDatasets()).to.deep.equal(expected);
			} catch (_err) {
				// console.log(_err);
				expect.fail("Should not have thrown an error.");
			}
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);

				if (errorExpected) {
					expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
				}
				// check each item
				// expect(result.length).to.equal(expected.length);
				// for (let i = 0; i < result.length; i++) {
				// 	console.log(result[i]);
				// 	expect(result[i]).to.deep.equal(expected[i]);
				// }
				// expect(result).to.have.deep.members(expected); // order doesn't matter (everything should pass)
				expect(result).to.deep.equal(expected); // original
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// return expect.fail("Write your assertion(s) here.");
				if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				} else {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
			}
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("one aanb", oneValidSection, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/complex.json] complex query", checkQuery);
		it("[valid/moreComplex.json] more complex query", checkQuery);
		it("[valid/validWildcard.json] *InputString*", checkQuery);
		// it("[valid/results5000.json] result === 5000", checkQuery);
		it("[valid/validAnd.json] valid AND", checkQuery);
		it("[valid/validEqual.json] valid EQ", checkQuery);
		it("[valid/validNot.json] valid NOT", checkQuery);
		it("[valid/validIs.json] valid IS", checkQuery);
		// it("[valid/validWithOrder.json] valid with ORDER", checkQuery);
		// it("[valid/everythingMadness.json] use everything", checkQuery);

		it("[invalid/missingQuery.json] Query missing", checkQuery);
		it("[invalid/stringQuery.json] Query is String", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery); // given case (missing WHERE)
		it("[invalid/missingOptions.json] Query missing OPTIONS", checkQuery); // missing OPTIONS
		it("[invalid/missingCols.json] OPTIONS missing COLUMNS", checkQuery); // missing COLUMNS in OPTIONS
		it("[invalid/emptyCols.json] empty COLUMNS in OPTIONS", checkQuery); // empty array in COLUMNS in OPTIONS
		it("[invalid/results5001.json] result === 5001", checkQuery);
		it("[invalid/resultTooLarge.json] result > 5000", checkQuery); // result too large
		it("[invalid/invalidKey.json] Invalid key sections_students", checkQuery); // selecting an s/mfield that doesn't exist
		it("[invalid/tooManyDatasets.json] QUERY > 1 dataset", checkQuery); // selecting too many datasets
		it("[invalid/notFoundDataset.json] QUERY not added dataset", checkQuery); // selecting a dataset that isn't found
		it("[invalid/emptyFilter.json] GT > 1 key", checkQuery); // empty MCOMPARATOR
		it("[invalid/emptyScomparisonFilter.json] IS > 1 key", checkQuery); // empty SCOMPARATOR
		it("[invalid/emptyLogicFilter.json] OR empty", checkQuery); // empty FILTER_LIST in LOGIC in FILTER
		it("[invalid/emptyNegationFilter.json] NOT > 1 key", checkQuery); // empty NEGATION filter
		it("[invalid/wildcard.json] QUERY middle wildcard", checkQuery);
		it("[invalid/wildcard2.json] QUERY middle wildcard in middle", checkQuery);
		it("[invalid/wildcard3.json] QUERY middle wildcard near last character", checkQuery);
		it("[invalid/and0Key.json] AND === 0 key", checkQuery);
		it("[invalid/and2Keys.json] AND === 2 keys", checkQuery); // and has at least 2 keys
		it("[invalid/andIsString.json] AND type is String", checkQuery); // and contains a string
		it("[invalid/LTIsString.json] LT type is String", checkQuery); // LT contains string
		it("[invalid/OrderNotInColumns.json] ORDER key not in COLUMNS", checkQuery);
		it("[invalid/invalidQueryKey.json] no underscore for query key", checkQuery);
		it("[invalid/notEBNFKey.json] not an EBNF key", checkQuery);
		it("[invalid/emptyOrder.json] ORDER IS empty object", checkQuery);
		it("[invalid/datasetNotFound.json] dataset not found", checkQuery);
		it("[invalid/emptyDatasetId.json] empty dataset id", checkQuery);
		it("[invalid/deptInGT.json] dept key in GT", checkQuery);
		it("[invalid/uuidInGT.json] uuid key in GT", checkQuery);
		it("[invalid/idInGT.json] id key in GT", checkQuery);
		it("[invalid/titleInGT.json] title key in GT", checkQuery);
		it("[invalid/instructorInGT.json] instructor key in GT", checkQuery);
		// it("[invalid/notInLogic.json] NOT in AND", checkQuery);
		// it("[invalid/reversedQuery.json] reverse query keys", checkQuery);
		it("[invalid/where2Keys.json] WHERE === 2 keys", checkQuery);
		it("[invalid/eq0Key.json] EQ === 0 key", checkQuery);
		it("[invalid/eq2Key.json] EQ === 2 keys", checkQuery);
		it("[invalid/gt0Key.json] GT === 0 key", checkQuery);
		it("[invalid/gt2Key.json] GT === 2 keys", checkQuery);
		it("[invalid/lt0Key.json] LT === 0 key", checkQuery);
		it("[invalid/lt2Key.json] LT === 2 keys", checkQuery);
		it("[invalid/is0Key.json] IS === 0 key", checkQuery);
		it("[invalid/is2Key.json] IS === 2 keys", checkQuery);
		it("[invalid/not0Key.json] NOT === 0 key", checkQuery);
		it("[invalid/not2Key.json] NOT === 2 keys", checkQuery);

		it("should reject with a input that is not object type", async function () {
			try {
				await facade.performQuery(1);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("[valid/noFilter.json] no filter used (empty WHERE)", checkQuery);
		it("[invalid/noMatchingDataset.json] no such dataset added", checkQuery);
		it("[invalid/referenceTwoDatasets.json] references 2 existing datasets", checkQuery);
		it("[valid/noResults.json] valid query that has zero results", checkQuery);
		it("[valid/negativeNumberFilter.json] negative number in WHERE under LT", checkQuery);
		it("[valid/zeroCharacterFilter.json] zero character in string under IS filter", checkQuery);

		describe("C2 new functionality: valid queries", function () {
			it("[valid/simpleQueryTransformations.json] simple query transformations", checkQuery);
			it("[valid/roomsQueryExample.json] rooms query example from spec", checkQuery);
			// it("[valid/nonNumericKeyForCount.json] non-numeric key for COUNT", checkQuery);
			it("[valid/validCount.json] valid query using COUNT", checkQuery);
			// it("[valid/useLatLonSumQuery.json] valid query that uses lat, lon, and SUM", checkQuery);
			it("[valid/applyNotInColumns.json] APPLY key not in COLUMNS", checkQuery);
			it("[valid/twoApply.json] two APPLY keys", checkQuery);
			it("[valid/twoOrderKeys.json] two ORDER keys", checkQuery); //shouldnt fail because of unique order
			it("[valid/twoOrderResolveTies.json] two ORDER keys that resolve ties", checkQuery);
			it("[valid/orderDownResolveTies.json] ORDER down resolves ties", checkQuery);
			it("[valid/orderUpResolveTies.json] ORDER up resolves ties", checkQuery);
			// it("[valid/groupWithOrderApplykey.json] GROUP with ORDER using APPLY key", checkQuery);
			it("[valid/groupWithOrderGroup.json] GROUP with ORDER using GROUP key", checkQuery);
			// it("[valid/moreGroupAndApply.json] 2 GROUP and 2 APPLY keys", checkQuery);
			// it("[valid/everythingRooms.json] use everything with rooms", checkQuery);
			// it("[valid/emptyApply.json] empty APPLY key", checkQuery);
			it("[valid/moreApply.json] more APPLY keys", checkQuery);
			it("[valid/moreGroup.json] more GROUP keys", checkQuery);
			it("[valid/avgAvg.json] find AVG of sections_avg", checkQuery);
			it("[valid/emptyCellsInTable.json] empty cells in resulting table", checkQuery);
			it("[valid/lessColumns.json] some GROUP keys not in columns", checkQuery);
			it("[valid/otherFurniture.json] other furniture query", checkQuery);
			it("[valid/year2009.json] year 2009 query", checkQuery);
			it("[valid/everyFilterRooms.json] use every filter with rooms", checkQuery);
			it("[valid/orderRoomsNumber.json] order rooms by number", checkQuery);
			it("[valid/orderRoomsMaxSeats.json] order rooms by max seats", checkQuery);
			it("[valid/orderRoomsTwoApply.json] order rooms by two APPLY keys", checkQuery);
			it("[valid/orderRoomsTwoApply2.json] order rooms by two APPLY keys #2", checkQuery);
			it("[valid/orderRoomsShortnameUP.json] order rooms by shortname UP", checkQuery);
			it("[valid/orderRoomsShortnameDOWN.json] order rooms by shortname DOWN", checkQuery);
			it("[valid/applyMAX.json] simple MAX query", checkQuery);
			it(
				"[valid/validMAX.json] Retrieve shortname and maximum seats where furniture includes 'Tables' and seats greater 300",
				checkQuery
			);
		});

		describe("C2 new functionality: invalid queries", function () {
			it("[invalid/transformationsString.json] TRANSFORMATIONS is a string", checkQuery);
			it("[invalid/transformationsNotValid.json] one invalid empty object", checkQuery);
			it("[invalid/invalidTransformations.json] APPLY has one empty object which is invalid", checkQuery);
			it(
				"[invalid/groupingWithout_.json] max of seats WHERE furniture contains 'Tables' and seats > 300 and dir = UP",
				checkQuery
			);
			it("[invalid/keyIDandkeydifferent.json] invalid group key", checkQuery);
			it("[invalid/invalidKeyTypeInApply.json] invalid key type in APPLY", checkQuery);
			it("[invalid/columnKeyNotInGroup.json] column key not in GROUP", checkQuery);
			it("[invalid/duplicateApplyKey.json] duplicate APPLY key", checkQuery); //
			it("[invalid/columnKeyNotInApply.json] column key not in APPLY", checkQuery);
			it("[invalid/sortKeyNotInColumns.json] sort key not in COLUMNS", checkQuery);
			it("[invalid/sectionsUsingRoomsKey.json] sections query using rooms key", checkQuery);
			it("[invalid/roomsUsingSectionsKey.json] rooms query using sections key", checkQuery);
			it("[invalid/diffDatasetIdInApply.json] different dataset id in APPLY", checkQuery);
			it("[invalid/invalidApplytoken.json] invalid APPLY token", checkQuery);
			it("[invalid/invalidKeyInGroup.json] invalid key in GROUP", checkQuery);
			it("[invalid/invalidKeyTypeAvg.json] invalid key type in AVG", checkQuery);
			it("[invalid/invalidKeyTypeMax.json] invalid key type in MAX", checkQuery);
			it("[invalid/invalidKeyTypeMin.json] invalid key type in MIN", checkQuery);
			it("[invalid/invalidKeyTypeSum.json] invalid key type in SUM", checkQuery);
			it("[invalid/noApply.json] no APPLY key", checkQuery);
			it("[invalid/noColumns.json] no COLUMNS key", checkQuery);
			it("[invalid/noGroup.json] no GROUP key", checkQuery);
			it("[invalid/underscoreApplykey.json] APPLY key with underscore", checkQuery);
			it("[invalid/diffIdInApply.json] different id in APPLY", checkQuery);
			it("[invalid/invalidApplyTargetKey.json] invalid APPLY target key", checkQuery);
			it("[invalid/invalidDir.json] invalid DIRECTION", checkQuery);
			it("[invalid/invalidKeyCount.json] invalid key in COUNT", checkQuery);
			it("[invalid/invalidKeyMax.json] invalid key in MAX", checkQuery);
		});

		describe("C2: more coverage", function () {
			it("[valid/mkeyFlagRoom.json] valid query using mkey flag in rooms", checkQuery);
			it("[valid/mkeyFlagSections.json] valid query using mkey flag in sections", checkQuery);
			it("[valid/diffIdGT.json] different id in GT", checkQuery);
			it("[valid/useEQ.json] valid query using EQ", checkQuery);
		});
	});
});
