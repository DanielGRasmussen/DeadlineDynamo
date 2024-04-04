class Course {
	id: number;
	name: string;
	code: string;
	assignments: Assignment[] = [];
	utility: Utility = data.utility;

	constructor(
		id: number,
		name: string,
		code: string,
		assignments: AssignmentJson[],
		localAssignments: LocalAssignmentJson[] = []
	) {
		this.utility.log("Making course: " + name);
		this.id = id;
		this.name = name;
		this.code = code;
		this.makeAssignments(assignments, localAssignments);
	}

	makeAssignments(assignments: AssignmentJson[], localAssignments: LocalAssignmentJson[]): void {
		// Use the right format depending on if the assignments are from the API or storage.
		// TypeScript is not a big fan of the || tool when I have both formats as options for the same variable.
		if (assignments.length !== 0) {
			// This is API data.
			// Filter out assignments that don't belong to this course.
			assignments = assignments.filter(assignment => {
				return assignment.course_id === this.id;
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

			this.assignments = assignments.map(this.storageAssignment);
		} else {
			// This is storage data.
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
					assignment.lock,
					assignment.planned,
					// If it's undefined, use the same process as the API data.
					assignment.shown !== undefined
						? assignment.shown
						: assignment.type !== "calendar_event"
							? !assignment.submitted
							: true,
					assignment.read,
					assignment.basic_estimate,
					assignment.history_estimate,
					assignment.user_estimate,
					assignment.time_taken
				);
			});
		}
	}

	updateAssignments(assignments: AssignmentJson[]): Assignment[] {
		// Uses the old information from assignments and the new information from the API to update the assignments.
		// Takes a filtered assignments for just this course with API information.
		// Returns a list of new assignments.
		const newAssignments: Assignment[] = [];
		for (const assignment of assignments) {
			const oldAssignment: Assignment | undefined = this.assignments.find(
				assign => assign.id === assignment.plannable.id
			);
			if (oldAssignment !== undefined) {
				if (
					// If the due date has changed, and it's a planned or locked assignment let the user know.
					oldAssignment.due_date.getTime() !==
						new Date(assignment.plannable_date).getTime() &&
					(oldAssignment.planned || oldAssignment.lock)
				) {
					if (oldAssignment.type === "calendar_event") {
						this.utility.notify(
							"info",
							`Time changed for ${oldAssignment.name} from ${this.name}.`
						);
					} else {
						this.utility.notify(
							"info",
							`Due date changed for ${oldAssignment.name} in ${this.name}`
						);
					}
				}

				if (!oldAssignment.submitted && assignment.submissions.submitted) {
					oldAssignment.shown = false;
				}

				oldAssignment.name = assignment.plannable.title;
				oldAssignment.type = assignment.plannable_type;
				oldAssignment.submitted = assignment.submissions.submitted;
				oldAssignment.due_date = new Date(assignment.plannable_date);
				oldAssignment.start_date = assignment.plannable.start_at
					? new Date(assignment.plannable.start_at)
					: null;
				oldAssignment.end_date = assignment.plannable.end_at
					? new Date(assignment.plannable.end_at)
					: null;
				oldAssignment.points_possible = assignment.plannable.points_possible;
				oldAssignment.location_name = assignment.plannable.location_name || "";
				oldAssignment.lock =
					oldAssignment.lock || assignment.plannable_type === "calendar_event";
			} else {
				// Adds a new assignment
				const newAssignment: Assignment = this.storageAssignment(assignment);
				newAssignments.push(newAssignment);
				this.assignments.push(newAssignment);
			}
		}
		return newAssignments;
	}

	storageAssignment(assignment: AssignmentJson): Assignment {
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
			assignment.plannable_type === "calendar_event",
			false,
			// If it is an event, it will default to shown, otherwise it's the opposite of if it's been
			// submitted.
			assignment.plannable_type !== "calendar_event"
				? !assignment.submissions.submitted
				: true,
			false,
			null,
			null,
			null,
			null
		);
	}

	addExtraData(extraData: AssignmentExtraJson[]): void {
		// Adds extra data to the assignments.
		// Takes a filtered assignments for just this course with API information.
		for (const assignment of this.assignments) {
			const newAssignment: AssignmentExtraJson | undefined = extraData.find(
				assign =>
					assign.id === assignment.id ||
					assign.quiz_id === assignment.id ||
					assign.discussion_topic?.id === assignment.id
			);

			if (newAssignment !== undefined) {
				assignment.description = newAssignment.description;
				assignment.submission_types = newAssignment.submission_types;
			}
		}
	}

	async saveCourse(): Promise<void> {
		const key: string = `course-${this.id}`;
		const data: LocalCourseJson = JSON.parse(JSON.stringify(this));
		// Remove the unneeded items from data.
		delete data.utility;
		for (const assignment of data.assignments) {
			delete assignment.description;
			delete assignment.submission_types;
		}

		const dataString: string = JSON.stringify(data);

		// Get course ids, ensure this course id is in that list, and save the course.
		const courseIds: string | undefined = await this.utility.loadStorage("courseIds");
		// Ensure we can access this course id again.
		if (courseIds === undefined) {
			this.utility.saveStorage("courseIds", JSON.stringify([key]));
		} else {
			const courses: string[] = JSON.parse(courseIds);
			if (!courses.includes(key)) {
				courses.push(key);
				this.utility.saveStorage("courseIds", JSON.stringify(courses));
			}
		}

		this.utility.saveStorage(key, dataString);
	}
}
