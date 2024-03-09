class Main {
	courses?: Course[];
	utility: Utility = new Utility();
	apiFetcher: ApiFetcher = new ApiFetcher();
	estimator: Estimator = new Estimator();
	doneLoading: boolean = false;

	constructor() {
		this.main();
	}

	async main(): Promise<void> {
		const firstLoadup: boolean = await this.getCourses();

		if (!firstLoadup) {
			await this.updateCourses();
			await this.updateAssignments();
		}
		this.doneLoading = true;
	}

	async getCourses(): Promise<boolean> {
		// Gets all courses.
		// If it's the first time loading up, it gets everything from scratch.
		// If it's not the first time, it gets everything from local storage.
		const courseIds: string | undefined = await this.utility.loadStorage("courseIds");

		if (courseIds === undefined) {
			// First time loading up so it'll return true.
			await this.firstLoadup();
			return true;
		}
		// Load stuff from local storage.
		// Course ids isn't null so this will be returning false.
		const course_ids: string[] = JSON.parse(courseIds);
		const courses: Course[] = [];

		let courseData: string | undefined;
		let courseJson: LocalCourseJson;
		let course: Course;
		for (const course_id of course_ids) {
			courseData = await this.utility.loadStorage(course_id);

			if (courseData === undefined) {
				// Get all data from scratch if any course localstorage data is missing.
				// This would happen either when a course is added/removed or when the user tampered with local storage.
				await this.firstLoadup();
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
			courses.push(course);
		}
		this.courses = courses;
		return false;
	}

	async firstLoadup() {
		// First time loading up, therefore we need to get everything from scratch.
		await this.apiFetcher.makeCourses();
		this.courses = this.apiFetcher.courses;

		for (const course of this.courses) {
			await course.saveCourse();
		}
	}

	async updateCourses(): Promise<void> {
		// Gets updated info for courses
		if (this.courses === undefined) {
			this.utility.alerter("Error: Courses not loaded!");
			return;
		}

		// Get API info for all courses.
		const courses: CourseJson[] = await this.apiFetcher.fetchCourses();

		let currentCourse: Course | undefined;
		for (const course of courses) {
			// Match API info with local info to update the user on changes.
			// Then update the local info.
			currentCourse = this.courses.find(item => item.id === course.id);
			if (currentCourse === undefined) {
				this.utility.alerter(`New course: ${course.shortName}`);

				// Get new course's assignments
				let assignments: AssignmentJson[] = await this.apiFetcher.fetchAssignments();
				assignments = assignments.filter(assignment => assignment.course_id === course.id);

				// Make the new course.
				currentCourse = new Course(
					course.id,
					course.shortName,
					course.courseCode,
					assignments
				);

				// Save the new course's info.
				this.courses.push(currentCourse);
				currentCourse.saveCourse();
				return;
			}
			if (currentCourse.name !== course.shortName) {
				// Alert, change, and save new data if it exists.
				this.utility.alerter(
					`A course's name changed from ${currentCourse.name} to ${course.shortName}.`
				);
				currentCourse.name = course.shortName;
				currentCourse.saveCourse();
			}
			if (currentCourse.code !== course.courseCode) {
				// Alert, change, and save new data if it exists.
				this.utility.alerter(
					`${currentCourse.name}'s code changed from ${currentCourse.code} to ${course.courseCode}.`
				);
				currentCourse.code = course.courseCode;
				currentCourse.saveCourse();
			}
		}
	}

	async updateAssignments(): Promise<void> {
		// Gets updated info for assignments.
		if (this.courses === undefined) {
			this.utility.alerter("Error: Courses not loaded!");
			return;
		}

		// TODO: Get updated info for assignments.
	}
}
