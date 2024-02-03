// import { Course } from "./Course";
// import { LocalStorage } from "./LocalStorage";

export class Estimator {
	courses: Course[];
	utility: Utility = new Utility();

	constructor(courses: Course[]) {
		this.courses = courses;
	}

	estimateTime(): number {
		return 0;
	}

	historyEstimateTime(): number {
		return 0;
	}
}

// export { Estimator };
