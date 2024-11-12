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

	// Sample on how to format PUT requests
	it("PUT test for courses dataset", function () {
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
			// and some more logging here!
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
