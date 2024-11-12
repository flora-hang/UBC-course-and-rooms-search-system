import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";
// import exp from "constants";
// import { get } from "http";

describe.only("Facade C3", function () {
	const port = 4321;
	let server: Server;
	const SERVER_URL = "http://localhost:4321";

	before(async function () {
		// TODO: start server here once and handle errors properly
		server = new Server(port);
		return server.start().catch((err: Error) => {
			throw new Error(`Server::start() - ERROR: ${err.message}`);
		});
	});

	after(async function () {
		// TODO: stop server here once!
		return server.stop().catch((err: Error) => {
			throw new Error(`Server::stop() - ERROR: ${err.message}`);
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// PUT: resolve
	// Sample on how to format PUT requests
	it("PUT resolve: test for valid sections dataset", async function () {
		// const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/mysections/sections"; // id: mysections, kind: sections
		const ZIP_FILE_DATA = Buffer.from("../resources/archives/pair.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info("Received response from PUT request");
					Log.info("Response: " + res.text);
					Log.info("Status: " + res.status);
					Log.info("Body: " + res.body);
					expect(res.status).to.be.equal(StatusCodes.OK);
					expect(res.body).to.have.property("result").that.is.an("array");
					const expectedResult = ["mysections"];
					expect(res.body.result).to.deep.equal(expectedResult);
				})
				.catch(function (err) {
					// some logging here please!
					Log.error("Error in PUT request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during PUT request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation

	// PUT: reject
	it("PUT reject: test for invalid sections dataset", async function () {
		// const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/badsections/sections"; // id: badsections, kind: sections
		const ZIP_FILE_DATA = Buffer.from("../resources/archives/invalidDataset.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info("Received response from PUT request");
					Log.info("Response: " + res.text);
					Log.info("Status: " + res.status);
					Log.info("Body: " + res.body);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
					expect(res.body).to.have.property("error").that.is.a("string");
				})
				.catch(function (err) {
					// some logging here please!
					Log.error("Error in PUT request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during PUT request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// DELETE: resolve
	it("DELETE resolve: test for existing dataset", async function () {
		// const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/mysections/sections"; // id: mysections, kind: sections
		const ZIP_FILE_DATA = Buffer.from("../resources/archives/pair.zip");
		const ENDPOINT_URL_DELETE = "/dataset/mysections";

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					expect(res.status).to.be.equal(StatusCodes.OK);
					expect(res.body).to.have.property("result").that.is.an("array");
					const expectedResult = ["mysections"];
					expect(res.body.result).to.deep.equal(expectedResult);

					return request(SERVER_URL)
						.delete(ENDPOINT_URL_DELETE)
						.then(function (deleteRes: Response) {
							// Logging the response details for DELETE request
							Log.info("Received response from DELETE request");
							Log.info("Response: " + deleteRes.text);
							Log.info("Status: " + deleteRes.status);
							Log.info("Body: " + JSON.stringify(deleteRes.body));
							expect(deleteRes.status).to.be.equal(StatusCodes.OK);
							expect(deleteRes.body).to.have.property("result").that.is.a("string");
							const expectedStr = "mysections";
							expect(deleteRes.body.result).to.deep.equal(expectedStr);
						})
						.catch(function (err) {
							Log.error("Error in DELETE request");
							Log.error(err);
							expect.fail();
						});
				})
				.catch(function (err) {
					// some logging here please!
					Log.error("Error in PUT request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during PUT/DELETE request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// DELETE: InsightError
	it("DELETE InsightError: test for invalid dataset id", async function () {
		// const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_DELETE = "/dataset/my_sections";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL_DELETE)
				.then(function (deleteRes: Response) {
					Log.info("Received response from DELETE request");
					Log.info("Response: " + deleteRes.text);
					Log.info("Status: " + deleteRes.status);
					Log.info("Body: " + JSON.stringify(deleteRes.body));
					expect(deleteRes.status).to.be.equal(StatusCodes.BAD_REQUEST);
					expect(deleteRes.body).to.have.property("error").that.is.a("string");
				})
				.catch(function (err) {
					Log.error("Error in DELETE request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during DELETE request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// DELETE: NotFoundError
	it("DELETE NotFoundError: test for nonexistenet dataset", async function () {
		// const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_DELETE = "/dataset/mysections";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL_DELETE)
				.then(function (deleteRes: Response) {
					Log.info("Received response from DELETE request");
					Log.info("Response: " + deleteRes.text);
					Log.info("Status: " + deleteRes.status);
					Log.info("Body: " + JSON.stringify(deleteRes.body));
					expect(deleteRes.status).to.be.equal(StatusCodes.NOT_FOUND);
					expect(deleteRes.body).to.have.property("error").that.is.a("string");
				})
				.catch(function (err) {
					Log.error("Error in DELETE request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during DELETE request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// POST: resolve
	it("POST resolve: test for valid simple query", async function () {
		const ENDPOINT_URL = "/dataset/mysections/sections";
		const ZIP_FILE_DATA = Buffer.from("../resources/archives/pair.zip");
		const ENDPOINT_URL_QUERY = "/query";
		const VALID_QUERY = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};
		const expectedArray = [
			{ sections_dept: "math", sections_avg: 97.09 },
			{ sections_dept: "math", sections_avg: 97.09 },
			{ sections_dept: "epse", sections_avg: 97.09 },
			{ sections_dept: "epse", sections_avg: 97.09 },
			{ sections_dept: "math", sections_avg: 97.25 },
			{ sections_dept: "math", sections_avg: 97.25 },
			{ sections_dept: "epse", sections_avg: 97.29 },
			{ sections_dept: "epse", sections_avg: 97.29 },
			{ sections_dept: "nurs", sections_avg: 97.33 },
			{ sections_dept: "nurs", sections_avg: 97.33 },
			{ sections_dept: "epse", sections_avg: 97.41 },
			{ sections_dept: "epse", sections_avg: 97.41 },
			{ sections_dept: "cnps", sections_avg: 97.47 },
			{ sections_dept: "cnps", sections_avg: 97.47 },
			{ sections_dept: "math", sections_avg: 97.48 },
			{ sections_dept: "math", sections_avg: 97.48 },
			{ sections_dept: "educ", sections_avg: 97.5 },
			{ sections_dept: "nurs", sections_avg: 97.53 },
			{ sections_dept: "nurs", sections_avg: 97.53 },
			{ sections_dept: "epse", sections_avg: 97.67 },
			{ sections_dept: "epse", sections_avg: 97.69 },
			{ sections_dept: "epse", sections_avg: 97.78 },
			{ sections_dept: "crwr", sections_avg: 98 },
			{ sections_dept: "crwr", sections_avg: 98 },
			{ sections_dept: "epse", sections_avg: 98.08 },
			{ sections_dept: "nurs", sections_avg: 98.21 },
			{ sections_dept: "nurs", sections_avg: 98.21 },
			{ sections_dept: "epse", sections_avg: 98.36 },
			{ sections_dept: "epse", sections_avg: 98.45 },
			{ sections_dept: "epse", sections_avg: 98.45 },
			{ sections_dept: "nurs", sections_avg: 98.5 },
			{ sections_dept: "nurs", sections_avg: 98.5 },
			{ sections_dept: "nurs", sections_avg: 98.58 },
			{ sections_dept: "nurs", sections_avg: 98.58 },
			{ sections_dept: "epse", sections_avg: 98.58 },
			{ sections_dept: "epse", sections_avg: 98.58 },
			{ sections_dept: "epse", sections_avg: 98.7 },
			{ sections_dept: "nurs", sections_avg: 98.71 },
			{ sections_dept: "nurs", sections_avg: 98.71 },
			{ sections_dept: "eece", sections_avg: 98.75 },
			{ sections_dept: "eece", sections_avg: 98.75 },
			{ sections_dept: "epse", sections_avg: 98.76 },
			{ sections_dept: "epse", sections_avg: 98.76 },
			{ sections_dept: "epse", sections_avg: 98.8 },
			{ sections_dept: "spph", sections_avg: 98.98 },
			{ sections_dept: "spph", sections_avg: 98.98 },
			{ sections_dept: "cnps", sections_avg: 99.19 },
			{ sections_dept: "math", sections_avg: 99.78 },
			{ sections_dept: "math", sections_avg: 99.78 },
		];

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					expect(res.status).to.be.equal(StatusCodes.OK);
					expect(res.body).to.have.property("result").that.is.an("array");
					const expectedResult = ["mysections"];
					expect(res.body.result).to.deep.equal(expectedResult);

					return request(SERVER_URL)
						.post(ENDPOINT_URL_QUERY)
						.send(VALID_QUERY)
						.set("Content-Type", "application/json")
						.then(function (res1: Response) {
							Log.info("Received response from POST request");
							Log.info("Response: " + res1.text);
							Log.info("Status: " + res1.status);
							Log.info("Body: " + JSON.stringify(res1.body));
							expect(res1.status).to.be.equal(StatusCodes.OK);
							expect(res1.body).to.have.property("result").that.is.an("array");
							expect(res1.body.result).to.deep.equal(expectedArray);
						})
						.catch(function (err) {
							Log.error("Error in POST request");
							Log.error(err);
							expect.fail();
						});
				})
				.catch(function (err) {
					// some logging here please!
					Log.error("Error in PUT request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during PUT/POST request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// POST: reject
	it("POST reject: test for invalid query", async function () {
		const ENDPOINT_URL = "/dataset/mysections/sections";
		const ZIP_FILE_DATA = Buffer.from("../resources/archives/pair.zip");
		const ENDPOINT_URL_QUERY = "/query";
		const INVALID_QUERY = {};

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					expect(res.status).to.be.equal(StatusCodes.OK);
					expect(res.body).to.have.property("result").that.is.an("array");
					const expectedResult = ["mysections"];
					expect(res.body.result).to.deep.equal(expectedResult);

					return request(SERVER_URL)
						.post(ENDPOINT_URL_QUERY)
						.send(INVALID_QUERY)
						.set("Content-Type", "application/json")
						.then(function (res1: Response) {
							Log.info("Received response from POST request");
							Log.info("Response: " + res1.text);
							Log.info("Status: " + res1.status);
							Log.info("Body: " + JSON.stringify(res1.body));
							expect(res1.status).to.be.equal(StatusCodes.BAD_REQUEST);
							expect(res1.body).to.have.property("error").that.is.an("string");
						})
						.catch(function (err) {
							Log.error("Error in POST request");
							Log.error(err);
							expect.fail();
						});
				})
				.catch(function (err) {
					// some logging here please!
					Log.error("Error in PUT request");
					Log.error(err);
					expect.fail();
				});
		} catch (err) {
			Log.error("Exception caught during PUT/POST request");
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	// GET: resolve
});
