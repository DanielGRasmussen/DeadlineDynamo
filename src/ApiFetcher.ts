class ApiFetcher {
	apiUrl: string =
		"https://byui.instructure.com/api/v1/courses?enrollment_state=active&per_page=50";
	courses: Course[] = [];

	async fetchCourses(): Promise<CourseJson[]> {
		const response: Response = await fetch(this.apiUrl);
		const data: CourseJson[] = await response.json();
		return data;
	}

	async fetchAssignments(courseId: number): Promise<AssignmentJson[]> {
		const assignmentUrl = `https://byui.instructure.com/api/v1/courses/${courseId}/assignments?per_page=50`;

		let length: number = 50;
		let allData: AssignmentJson[] = [];

		// Get all assignments but stop if there are less than 50.
		for (let page = 1; length === 50; page++) {
			const url = `${assignmentUrl}&page=${page}`;
			const response = await fetch(url);
			const data: AssignmentJson[] = await response.json();

			length = data.length;

			allData = allData.concat(data);
		}
		return allData;
	}

	async makeCourses(): Promise<void> {
		const courses: CourseJson[] = await this.fetchCourses();
		for (const course of courses) {
			const assignments: AssignmentJson[] = await this.fetchAssignments(course.id);
			const newCourse: Course = new Course(
				course.id,
				course.name,
				course.course_code,
				assignments
			);
			this.courses.push(newCourse);
		}
	}
}
