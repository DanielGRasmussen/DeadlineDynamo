// import { Course } from "./Course";
// import { LocalStorage } from "./LocalStorage";

export class Estimator {
	courses: Course[];
	localStorage: LocalStorage = new LocalStorage();

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
