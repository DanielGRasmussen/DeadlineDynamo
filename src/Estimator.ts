class Estimator {
	courses!: Course[];
	assignment!: Assignment;
	courseId!: number;

	estimateTime(assignment: Assignment): void {
		if (!this.courses) {
			this.courses = data.courses;
		}
		// Check if there is a basic estimate that isn't 0. If it is 0 then it was set by a failure to load in time.
		// If there isn't then it should just predict the same thing.
		if (assignment.basic_estimate !== null && assignment.basic_estimate !== 0) {
			return;
		}

		// Get the base estimated time for the assignment.
		this.assignment = assignment;
		this.courseId = assignment.course_id;

		// Attendance quizzes can't be done early. Lock them.
		// Also make them take 1 minute.
		if (this.isAttendanceQuiz()) {
			this.assignment.lock = true;
			this.assignment.basic_estimate = 1;
			return;
		}

		// If there are no submission types, lock the assignment.
		if (this.assignment.submission_types.includes("none")) {
			this.assignment.lock = true;
			this.assignment.basic_estimate = 1;
			return;
		}

		// If there is no description and no submission types, it probably has not loaded yet.
		if (this.assignment.description === "" && this.assignment.submission_types.length === 0) {
			this.assignment.basic_estimate = 0;
			return;
		}

		// Check for explicit duration in description.
		const explicitDuration: number | null = this.findListedDuration();
		if (explicitDuration && explicitDuration > 0 && !isNaN(explicitDuration)) {
			this.assignment.basic_estimate = explicitDuration;
			return;
		}

		// Get base time. (Submission type.)
		const baseTime: number = this.submissionBaseTime();
		// Get keyword multiplier.
		const keywordModifier: number = this.getKeywordModifier();
		// TODO: Add multiplier for points. Points should be relative to overall points in that category for that class.

		this.assignment.basic_estimate = Math.floor(
			baseTime * keywordModifier * g_settings.estimateMultiplier[`course-${this.courseId}`]
		);
	}

	isAttendanceQuiz(): boolean {
		if (!this.assignment.submission_types.includes("online_quiz")) {
			return false;
		}
		// Identify attendance quizzes based on keywords in the title.
		const keywords: string[] = ["attendance", "presence", "check-in"];
		return keywords.some((keyword: string) =>
			this.assignment.name.toLowerCase().includes(keyword)
		);
	}

	findListedDuration(): number | null {
		// Look for an explicit duration in the description.
		if (!this.assignment.description) {
			return null;
		}
		// Regex pattern matching minutes with optional hours and decimals
		// I had AI generate it. Not my proudest moment, but it works (I think.)
		const regex: RegExp = /\d+(?:\.\d+)?(?:\s?hour?|h|minute?|m)?/gi;

		const matches: RegExpMatchArray | null = this.assignment.description.match(regex);

		if (matches?.length !== 1) return null;

		// Extract and convert to number
		const extractedValue: number = Number(this.assignment.description.match(/[\d.]+/));
		const letters: RegExpMatchArray | null = this.assignment.description.match(/[a-zA-Z]/);
		if (!letters) return null;
		const timeType: string = letters[0];

		if (timeType === "h") {
			return extractedValue * 60;
		}
		return extractedValue;
	}

	submissionBaseTime(): number {
		// Get the base time for the assignment based on the submission type.
		const submissionBaseTimes: { [key: string]: number } = {
			online_upload: 60,
			on_paper: 60,
			discussion_topic: 30,
			online_text_entry: 20,
			online_quiz: 10
		};

		for (const submissionBaseTime of Object.keys(submissionBaseTimes)) {
			if (this.assignment.submission_types.includes(submissionBaseTime)) {
				return submissionBaseTimes[submissionBaseTime];
			}
		}
		return 20;
	}

	getKeywordModifier(): number {
		// Get the keyword modifier for the assignment.
		const keywordSets: [RegExp, number][] = [
			// Get rid of practice final exams or the like.
			[/\bpractice\b/, 0.3],
			// Self evaluations are short but sometimes say "final" in them.
			[/\bself-evaluation\b/, 1],
			// Exam mostly to catch Final Exam
			[/\bexam\b/, 5],
			// With final exams out of the way this is mostly to catch final essays/projects
			[/\bfinal\b/, 3]
		];

		for (const keywordSet of keywordSets) {
			const keywordMatch: RegExpMatchArray | null = this.assignment.name
				.toLowerCase()
				.match(keywordSet[0]);
			if (keywordMatch !== null) {
				// Get the first matching keyword set.
				return keywordSet[1];
			}
		}
		return 1;
	}

	historyEstimate(course: Course, assignment: Assignment): void {
		// Finds similar assignments in the past and averages their times.
		// If there are no similar assignments, it does nothing.

		// Find similar assignments.
		// Remove any appendages (Week 1, W01, and W1)
		let name: string = assignment.name.toLowerCase();
		// Remove Week ##
		name = name.replace(/week\s?\d+/g, "");
		// Remove W ##
		name = name.replace(/w\s?\d+/g, "");
		// Remove W##
		name = name.replace(/w\d+/g, "");

		// If course is not found, try to find it.
		if (course === undefined) {
			// Get all courses.
			if (this.courses) {
				course = this.courses.find((course: Course) => course.id === assignment.course_id)!;
			} else {
				return;
			}
		}

		// Find similar assignments.
		const similarAssignments: Assignment[] = course.assignments.filter(
			(assignment: Assignment) =>
				assignment.name.toLowerCase().includes(name) && assignment.id !== assignment.id
		);

		// If there are no similar assignments, return.
		if (similarAssignments.length === 0) {
			return;
		}

		// Get the average time of the similar assignments.
		let total: number = 0;
		let count: number = 0;
		for (const similar_assignment of similarAssignments) {
			if (similar_assignment.time_taken !== null) {
				total += similar_assignment.time_taken;
				count++;
			}
		}

		assignment.history_estimate = total / count;
	}

	getPriority(assignment: Assignment): number {
		// Get the priority of the assignment.
		// If the assignment has already been submitted, it should have the lowest priority.
		if (assignment.submitted) {
			return 0;
		}
		let priority: number;

		// Check for keywords.
		priority = this.getKeywordPriority(assignment);

		// We should prioritize assignments that are due soon.
		const dueDate: Date = new Date(assignment.due_date);
		const daysUntilDue: number = utility.daysUntil(dueDate);

		// Modify the priority based on the days until due.
		if (daysUntilDue <= 1) {
			priority += 5;
		} else if (daysUntilDue <= 3) {
			priority += 3;
		}

		return priority;
	}

	getKeywordPriority(assignment: Assignment): number {
		// Get the keyword priority for the assignment.
		const keywordSets: [RegExp, number][] = [
			// Practice items generally should be completed early.
			[/\bpractice\b/, 7],
			// Studying is high priority and should take place before finals.
			[/\bstudy\b/, 7],
			// Exams are very important but should be done after studying.
			[/\bexam\b/, 6],
			// Finals are also very important but should be done after studying.
			[/\bfinal\b/, 6],
			// Self evaluations should be moderate priority.
			[/\bself-evaluation\b/, 5],
			// Homework is slightly below moderate priority.
			[/\bhomework\b/, 4],
			// Quizzes are slightly below moderate priority.
			[/\bquiz\b/, 4],
			// Discussions are generally low priority.
			[/\bdiscussion\b/, 3]
		];

		for (const keywordSet of keywordSets) {
			const keywordMatch: RegExpMatchArray | null = assignment.name
				.toLowerCase()
				.match(keywordSet[0]);
			if (keywordMatch !== null) {
				// Get the first matching keyword set.
				return keywordSet[1];
			}
		}
		return 0;
	}
}
