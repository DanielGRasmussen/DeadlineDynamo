class ApiFetcher {
	courseApi: string = window.location.origin + "/api/v1/dashboard/dashboard_cards";
	assignmentApi: string = window.location.origin + "/api/v1/planner/items?per_page=50";
	courses: Course[] = [];
	utility: Utility = new Utility();

	async fetchCourses(): Promise<CourseJson[]> {
		// Gets all courses from the API.
		this.utility.log("Fetching courses from API.");
		const response: Response = await fetch(this.courseApi);
		return await response.json();
	}

	async fetchAssignments(): Promise<AssignmentJson[]> {
		this.utility.log("Fetching assignments from API.");
		// Gets all assignments for a course.
		let allData: AssignmentJson[] = [];

		// Get planDistance from settings.
		const settings: SettingsJson = await this.utility.loadSettings();

		// Get start and end date
		const today: Date = new Date();
		let start_date: Date = new Date(today.setDate(today.getDate() - today.getDay() + 1));

		// Calculate x weeks from the Monday to determine where planning should end.
		const endDate: Date = new Date(
			start_date.setDate(start_date.getDate() + settings.planDistance * 7)
		);
		// Creating the new date sets the one used in it, so we need to reset monday to be monday.
		start_date = new Date(today);

		// Get all assignments but stop if there is no next page.
		let fetchUrl: string =
			this.assignmentApi +
			`&start_date=${start_date.toISOString()}&end_date=${endDate.toISOString()}`;
		while (fetchUrl) {
			const response: Response = await fetch(fetchUrl);
			const data: AssignmentJson[] = await response.json();
			allData = allData.concat(data);

			// Check for next page.
			const links: { [rel: string]: string } = this.utility.parseLinkHeader(
				response.headers.get("Link")
			);

			fetchUrl = links["next"];
		}

		return allData;
	}

	async fetchExtraAssignmentData(courseId: number): Promise<AssignmentExtraJson[]> {
		this.utility.log("Fetching extra assignment data from API.");
		const assignmentUrl: string =
			window.location.origin + `/api/v1/courses/${courseId}/assignments?per_page=50`;

		let length: number = 50;
		let allData: AssignmentExtraJson[] = [];

		// Get all assignments but stop if there are less than 50.
		for (let page: number = 1; length === 50; page++) {
			const url: string = `${assignmentUrl}&page=${page}`;
			const response: Response = await fetch(url);
			const data: AssignmentExtraJson[] = await response.json();

			length = data.length;

			allData = allData.concat(data);
		}

		return allData;
	}

	async makeCourses(): Promise<void> {
		// Makes all courses from the API.
		this.utility.log("Making courses from API.");
		const courses: CourseJson[] = await this.fetchCourses();
		const assignments: AssignmentJson[] = await this.fetchAssignments();

		for (const course of courses) {
			const newCourse: Course = new Course(
				course.id,
				course.shortName,
				course.courseCode,
				assignments
			);
			this.courses.push(newCourse);
		}
	}
}
