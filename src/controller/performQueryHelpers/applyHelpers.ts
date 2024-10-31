import ApplyRule, { useApply } from "../../models/query/ApplyRule";
import Room from "../../models/rooms/Room";
import Section from "../../models/sections/Section";
import { InsightError } from "../../controller/IInsightFacade";
import { mkeyFlag } from "./flagHelpers";

export function applyFunctionItems(
	groupedItems: (Section | Room)[][],
	applyRules: ApplyRule[],
	id: string
): Record<string, any>[][] {
	console.log("!!! in applyFunctionItems");
	if (!groupedItems) {
		throw new InsightError("group key error");
	}

	const results: any[] = []; // To store the results of the calculations

	// console.log("> before for loop, groupedItems: %o", groupedItems.length);
	// console.log("> applyRules: %o", applyRules);
	for (const grp of groupedItems) {
		// console.log("!!! group: %o", group);
		const resultItem: any = {}; // To hold the result for the current group

		applyRules.forEach((rule) => {
			const { applyKey, applyToken, key } = rule;

			const idOnly = key.split("_")[0];
			if (idOnly !== id) {
				throw new InsightError("id does not match in APPLY");
			}
			const keyOnly = key.split("_")[1];
			// console.log("!!! key: %o", keyOnly);
			if (applyToken !== "COUNT" && !mkeyFlag(keyOnly)) {
				throw new InsightError("Invalid apply key");
			}
			// console.log("!!! key: %o", keyOnly);

			// Extract values from the group based on the key
			try {
				//!!! just try-catch or check if key is valid?
				// console.log("group: %o", group);
				const values = grp.map((item) => (item as any)[keyOnly]);
				// console.log("> values: %o", values);
				useApply(resultItem, applyKey, applyToken, values);
			} catch (_error) {
				throw new InsightError("Invalid apply key in APPLY");
			}
		});
		// console.log("!!! resultItem: %o", resultItem);
		results.push(resultItem); // Add the result item to results array
	}
	console.log("---------------------------------");
	// console.log("> results: %o", results);
	return results;
}
