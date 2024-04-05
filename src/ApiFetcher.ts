class ApiFetcher {
	utility: Utility = new Utility();
	courses: Course[] = [];

	courseApi: string = window.location.origin + "/api/v1/dashboard/dashboard_cards";
	assignmentApi: string = window.location.origin + "/api/v1/planner/items?per_page=50";

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

		// Get all assignments but stop if there is no next page.
		let fetchUrl: string =
			this.assignmentApi +
			`&start_date=${data.startDate.toISOString()}&end_date=${data.endDate.toISOString()}`;
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
			const assignmentData: AssignmentExtraJson[] = await response.json();

			length = assignmentData.length;

			allData = allData.concat(assignmentData);
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
