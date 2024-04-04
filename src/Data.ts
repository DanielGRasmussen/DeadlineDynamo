class Data {
	utility: Utility = new Utility();
	apiFetcher: ApiFetcher = new ApiFetcher();
	estimator: Estimator = new Estimator();
	// [0] Header buttons are added. [1] Main is done loading.
	loadConditions: boolean[];
	courses: Course[] = this.apiFetcher.courses;
	settings: SettingsJson = {
		useBasicEstimate: true,
		useHistoryEstimate: true,
		workHours: {
			monday: 6,
			tuesday: 6,
			wednesday: 6,
			thursday: 6,
			friday: 6,
			saturday: 6,
			sunday: 0
		},
		estimateMultiplier: {},
		planDistance: 1,
		showEvents: true
	};
	plan: Plan = {};

	constructor(loadConditions: boolean[]) {
		this.loadConditions = loadConditions;

		this.main().then(_ => {});
	}

	async main(): Promise<void> {
		await this.utility.loadSettings(this.settings);
		await this.utility.loadPlan(this.plan);

		const isFirstLoadUp: boolean = await this.getCourses();

		if (!isFirstLoadUp) {
			// This just sends 1 request for all courses.
			await this.updateCourses();
			// This just sends 1 request for all assignments.
			await this.updateAssignments();
		}

		this.utility.log("Done loading.");
		this.loadConditions[1] = true;

		// This sends a request per course causing it to take too long for everything else.
		await this.addExtraData();
	}

	async getCourses(): Promise<boolean> {
		// Gets all courses.
		// If it's the first time loading up, it gets everything from scratch.
		// If it's not the first time, it gets everything from local storage.
		this.utility.log("Getting courses.");
		const courseIds: string | undefined = await this.utility.loadStorage("courseIds");

		if (courseIds === undefined) {
			// First time loading up so it'll return true.
			await this.firstLoadUp();
			return true;
		}
		// Load stuff from local storage.
		// Course ids isn't null so this will be returning false.
		const course_ids: string[] = JSON.parse(courseIds);

		let courseData: string | undefined;
		let courseJson: LocalCourseJson;
		let course: Course;
		for (const course_id of course_ids) {
			courseData = await this.utility.loadStorage(course_id);

			if (courseData === undefined) {
				// Get all data from scratch if any course localstorage data is missing.
				// This would happen either when a course is added/removed or when the user tampered with local storage.
				await this.firstLoadUp();
				return true;
			}
			courseJson = JSON.parse(courseData);
			course = new Course(
				courseJson.id,
				courseJson.name,
				courseJson.code,
				[], // Empty assignments so it knows to use the local format for assignments.
				courseJson.assignments
			);
			this.courses.push(course);
		}
		return false;
	}

	async firstLoadUp() {
		// First time loading up, therefore we need to get everything from scratch.
		this.utility.log("First time loading up.");
		await this.apiFetcher.makeCourses();
		this.courses = this.apiFetcher.courses;

		for (const course of this.courses) {
			await course.saveCourse();
		}
	}

	async updateCourses(): Promise<void> {
		// Gets updated info for courses
		if (this.courses.length === 0) {
			this.utility.notify("error", "No courses loaded!");
			return;
		}

		this.utility.log("Updating courses.");

		const newCourses: CourseJson[] = await this.apiFetcher.fetchCourses();
		// Check if any courses have been added or removed.
		const courseIds: number[] = this.courses.map((course: Course) => course.id);
		const newCourseIds: number[] = newCourses.map((course: CourseJson) => course.id);

		if (
			!courseIds.every((id: number) => newCourseIds.includes(id)) ||
			!newCourseIds.every((id: number) => courseIds.includes(id))
		) {
			await this.firstLoadUp();
			return;
		}
	}

	async updateAssignments(): Promise<void> {
		// Gets updated info for assignments.
		if (this.courses.length === 0) {
			this.utility.notify("error", "Courses not loaded!");
			return;
		}

		this.utility.log("Updating assignments.");

		const newAssignments: AssignmentJson[] = await this.apiFetcher.fetchAssignments();

		for (const course of this.courses) {
			const newCourseAssignments: AssignmentJson[] = newAssignments.filter(
				(assignment: AssignmentJson) => assignment.course_id === course.id
			);
			course.updateAssignments(newCourseAssignments);
		}
	}

	async addExtraData(): Promise<void> {
		// Adds extra data to the courses.
		if (this.courses.length === 0) {
			this.utility.notify("error", "Courses not loaded!");
			return;
		}

		this.utility.log("Adding extra data.");

		for (const course of this.courses) {
			const extraData: AssignmentExtraJson[] = await this.apiFetcher.fetchExtraAssignmentData(
				course.id
			);

			course.addExtraData(extraData);
		}
	}
}