export function mkeyFlag(field: string): boolean {
	switch (field) {
		case "avg":
			return true;
		case "pass":
			return true;
		case "fail":
			return true;
		case "audit":
			return true;
		case "year":
			return true;
		case "lat":
			return true;
		case "lon":
			return true;
		case "seats":
			return true;
		default:
			return false;
	}
}
