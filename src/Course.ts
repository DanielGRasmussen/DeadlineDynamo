class Course {
	id: number;
	name: string;
	code: string;
	assignments!: Assignment[];
	utility: Utility = new Utility();

	constructor(
		id: number,
		name: string,
		code: string,
		assignments: AssignmentJson[],
		localAssignments: LocalAssignmentJson[] = []
	) {
		this.id = id;
		this.name = name;
		this.code = code;
		this.makeAssignments(assignments, localAssignments);
	}

	makeAssignments(assignments: AssignmentJson[], localAssignments: LocalAssignmentJson[]): void {
		this.assignments = []; // Clear it out before we start.

		// Use the right format depending on if the assignments are from the API or local storage.
		// TypeScript is not a big fan of the || tool when I have both formats as options for the same variable.
		if (assignments.length !== 0) {
			// This is API data.
			// Filter out assignments that don't belong to this course.
			assignments = assignments.filter(assignment => {
				if (assignment.course_id !== this.id) {
					return false;
				}
				return true;
			});

			// Sort assignments by due date.
			assignments.sort((a, b) => {
				if (a.plannable_date < b.plannable_date) {
					return -1;
				}
				if (a.plannable_date > b.plannable_date) {
					return 1;
				}
				return 0;
			});

			this.assignments = assignments.map(assignment => {
				return new Assignment(
					assignment.plannable.id,
					assignment.course_id,
					assignment.plannable.title,
					assignment.plannable_type,
					assignment.submissions.submitted,
					new Date(assignment.plannable_date),
					assignment.plannable.start_at ? new Date(assignment.plannable.start_at) : null,
					assignment.plannable.end_at ? new Date(assignment.plannable.end_at) : null,
					assignment.plannable.points_possible,
					// If it's not an event it will be undefined.
					assignment.plannable.location_name || "",
					`https://byui.instructure.com/courses/${assignment.course_id}/assignments/${assignment.plannable.id}`,
					assignment.plannable_type === "calendar_event",
					false,
					null,
					null,
					null
				);
			});
		} else {
			// This is local storage data.
			this.assignments = localAssignments.map(assignment => {
				return new Assignment(
					assignment.id,
					assignment.course_id,
					assignment.name,
					assignment.type,
					assignment.submitted,
					new Date(assignment.due_date),
					assignment.start_date ? new Date(assignment.start_date) : null,
					assignment.end_date ? new Date(assignment.end_date) : null,
					assignment.points_possible,
					assignment.location_name,
					assignment.link,
					assignment.lock,
					assignment.planned,
					assignment.basic_estimate,
					assignment.history_estimate,
					assignment.user_estimate
				);
			});
		}
	}

	async saveCourse(): Promise<void> {
		const key: string = `course-${this.id}`;
		const data: string = JSON.stringify(this);

		const courseIds: string | null = await this.utility.loadStorage("courseIds");
		// Ensure we can access this course id again.
		if (courseIds === null) {
			await this.utility.saveStorage("courseIds", JSON.stringify([key]));
		} else {
			const courses: string[] = JSON.parse(courseIds);
			if (!courses.includes(key)) {
				courses.push(key);
				await this.utility.saveStorage("courseIds", JSON.stringify(courses));
			}
		}

		await this.utility.saveStorage(key, data);
	}
}
