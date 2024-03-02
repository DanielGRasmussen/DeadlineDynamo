class ApiFetcher {
	courseApi: string = "/api/v1/dashboard/dashboard_cards";
	assignmentApi: string = "/api/v1/planner/items?per_page=50";
	courses: Course[] = [];
	utility: Utility = new Utility();

	async fetchCourses(): Promise<CourseJson[]> {
		// Gets all courses from the API.
		const response: Response = await fetch(this.courseApi);
		return await response.json();
	}

	async fetchAssignments(): Promise<AssignmentJson[]> {
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

	async makeCourses(): Promise<void> {
		// Makes all courses from the API.
		const courses: CourseJson[] = await this.fetchCourses();
		const assignments: AssignmentJson[] = await this.fetchAssignments();

		console.log(assignments);

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
