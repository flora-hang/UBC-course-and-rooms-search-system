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
	let fakeSections: string;
	let validDataset: string;
	// let invalidDataset: string;
	let nonJSONCourseDataset: string;
	// let invalidCourseDataset: string;
	let badCoursesFolderDataset: string;
	let invalidSectionDataset: string;
	let oneValidSection: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		fakeSections = await getContentFromArchives("fakepair.zip"); // has two extra sections w/ avg === 65
		validDataset = await getContentFromArchives("validDataset.zip");
		// invalidDataset = await getContentFromArchives("invalidDataset.zip");
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

		it("reject only whitespace dataset id", function () {
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

			return expect(result).to.eventually.be.rejectedWith(InsightError, "Content not in base64 format");
		});

		it("reject content with dataset without any valid sections", function () {
			const result = facade.addDataset("invalidDataset", "invalidDataset.zip", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError, "No valid sections");
		});

		it("reject content with course not in JSON format", function () {
			const result = facade.addDataset("nonJSONCourseDataset", nonJSONCourseDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError, "No valid sections");
		});

		it('reject content with course not correctly located in a "courses" folder', function () {
			const result = facade.addDataset("badCoursesFolderDataset", badCoursesFolderDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError, "No valid sections");
		});

		it("reject content with section not containing all fields used by query", function () {
			const result = facade.addDataset("invalidSectionDataset", invalidSectionDataset, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError, "No valid sections");
		});

		// !!! will need to delete later in c2 and afterward
		it('reject kind parameter if is "rooms"', function () {
			const result = facade.addDataset("validDataset", validDataset, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError, "Invalid kind");
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

		it("reject dataset id == only whitespace", function () {
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
				expect(result).to.deep.equal(expected);
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
				facade.addDataset("sections", fakeSections, InsightDatasetKind.Sections),
				facade.addDataset("one aanb", oneValidSection, InsightDatasetKind.Sections),
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
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery); // given case
		it("[valid/complex.json] complex query", checkQuery);
		it("[valid/moreComplex.json] more complex query", checkQuery);
		it("[valid/validWildcard.json] *InputString*", checkQuery);
		// it("[valid/results5000.json] result === 5000", checkQuery);
		it("[valid/validAnd.json] valid AND", checkQuery);
		it("[valid/validEqual.json] valid EQ", checkQuery);
		it("[valid/validNot.json] valid NOT", checkQuery);
		it("[valid/validIs.json] valid IS", checkQuery);
		// it("[valid/validWithOrder.json] valid with ORDER", checkQuery);
		it("[valid/everythingMadness.json] use everything", checkQuery);

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
	});
});
