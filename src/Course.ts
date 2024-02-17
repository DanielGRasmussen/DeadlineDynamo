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
			// Sort assignments by due date.
			assignments.sort((a, b) => {
				if (a.due_at < b.due_at) {
					return -1;
				}
				if (a.due_at > b.due_at) {
					return 1;
				}
				return 0;
			});

			this.assignments = assignments.map(assignment => {
				return new Assignment(
					assignment.id,
					this.id,
					assignment.name,
					assignment.has_submitted_submissions,
					new Date(assignment.due_at),
					// If unlock_at is null, set to null, otherwise set to new Date(unlock_at)
					assignment.unlock_at === null ? null : new Date(assignment.unlock_at),
					assignment.description,
					assignment.submission_types,
					assignment.allowed_extensions,
					assignment.points_possible,
					`https://byui.instructure.com/courses/${this.id}/assignments/${assignment.id}`,
					false, // lock should be false for API by default.
					false, // planned should be false for API by default.
					// No estimates yet.
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
					this.id,
					assignment.name,
					assignment.submitted,
					new Date(assignment.dueDate),
					// If unlockAt is null, set to null, otherwise set to new Date(unlockAt)
					assignment.unlockAt === null ? null : new Date(assignment.unlockAt),
					assignment.description,
					assignment.submissionTypes,
					assignment.allowedExtensions,
					assignment.pointsPossible,
					assignment.link,
					assignment.lock,
					assignment.planned,
					assignment.basicEstimate,
					assignment.historyEstimate,
					assignment.userEstimate
				);
			});
		}
	}

	async saveCourse(): Promise<void> {
		const key: string = `course-${this.id}`;
		// Remove the assignment description to prevent using too much storage.
		for (const assignment of this.assignments) {
			assignment.description = null;
		}
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
