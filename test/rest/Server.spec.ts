import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";

describe.only("Facade C3", function () {
	const port = 4321;
	let server: Server;

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
		const SERVER_URL = "http://localhost:4321";
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
		const SERVER_URL = "http://localhost:4321";
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
		const SERVER_URL = "http://localhost:4321";
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
		const SERVER_URL = "http://localhost:4321";
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
		const SERVER_URL = "http://localhost:4321";
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

	// POST: reject

	// GET: resolve
});
