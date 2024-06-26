class Data {
	backPlan: number = 0;
	today: Date = new Date();
	startDate!: Date;
	endDate!: Date;
	apiFetcher: ApiFetcher = new ApiFetcher();
	estimator: Estimator = new Estimator();
	planner?: Planner;
	// [0] Header buttons are added. [1] Main is done loading.
	loadConditions: boolean[] = [false, false];
	courses: Course[] = this.apiFetcher.courses;

	constructor() {
		this.main();
	}

	async main(): Promise<void> {
		while (true) {
			if (g_settings !== undefined && g_plan !== undefined) {
				break;
			}
			await utility.wait(5);
		}
		this.startDate = utility.getWeekStart(new Date());
		this.endDate = new Date();
		this.endDate.setDate(
			this.startDate.getDate() + g_settings.planDistance * 7 + this.backPlan
		);

		this.today = new Date();
		this.today.setHours(0, 0, 0, 0);
		this.startDate.setHours(0, 0, 0, 0);
		this.endDate.setHours(23, 59, 59, 999);

		const isFirstLoadUp: boolean = await this.getCourses();

		if (!isFirstLoadUp) {
			// This just sends 1 request for all courses.
			await this.updateCourses();
			// This just sends 1 request for all assignments.
			await this.updateAssignments();
		}

		await this.addExtraData();

		utility.log("Done loading.");
		this.loadConditions[1] = true;
	}

	async getCourses(): Promise<boolean> {
		// Gets all courses.
		// If it's the first time loading up, it gets everything from scratch.
		// If it's not the first time, it gets everything from local storage.
		utility.log("Getting courses.");
		const courseIds: string | undefined = await utility.loadStorage("courseIds");

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
			courseData = await utility.loadStorage(course_id);

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
		utility.log("First time loading up.");
		await this.apiFetcher.makeCourses();
		this.courses = this.apiFetcher.courses;

		for (const course of this.courses) {
			await course.saveCourse();
		}
	}

	async updateCourses(): Promise<void> {
		// Gets updated info for courses
		if (this.courses.length === 0) {
			utility.notify("error", "No courses loaded!");
			return;
		}

		utility.log("Updating courses.");

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
			utility.notify("error", "Courses not loaded!");
			return;
		}

		utility.log("Updating assignments.");

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
			utility.notify("error", "Courses not loaded!");
			return;
		}

		utility.log("Adding extra data.");

		const promises: Promise<void>[] = [];
		for (const course of this.courses) {
			promises.push(
				this.apiFetcher
					.fetchExtraAssignmentData(course.id)
					.then((extraData: AssignmentExtraJson[]): void => {
						course.addExtraData(extraData);
					})
			);
		}

		await Promise.all(promises);
	}
}

// Make data a global so that all classes can get basic data without having to mess around with a confusing
// amount of arguments/hand-me-downs.
const data: Data = new Data();
new PlannerPreparer();
