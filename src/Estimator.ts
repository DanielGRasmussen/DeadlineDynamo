class Estimator {
	assignment!: Assignment;
	courseId!: number;
	utility: Utility = new Utility();
	settings!: SettingsJson;

	constructor() {
		this.utility.loadSettings().then((settings: SettingsJson): void => {
			this.settings = settings;
		});
	}

	estimateTime(assignment: Assignment, courseId: number): void {
		// Get the base estimated time for the assignment.
		this.assignment = assignment;
		this.courseId = courseId;

		// Attendance quizzes can't be done early. Lock them.
		// Also make them take 1 minute.
		if (this.isAttendanceQuiz()) {
			this.assignment.lock = true;
			this.assignment.basicEstimate = 1;
			return;
		}

		// If there are no submission types, lock the assignment.
		if (this.assignment.submissionTypes.includes("none")) {
			this.assignment.lock = true;
			this.assignment.basicEstimate = 0;
			return;
		}

		// Check for explicit duration in description.
		const explicitDuration: number | null = this.findListedDuration();
		if (explicitDuration && explicitDuration > 0 && !isNaN(explicitDuration)) {
			this.assignment.basicEstimate = explicitDuration;
			return;
		}

		// Get base time. (Submission type.)
		const baseTime: number = this.submissionBaseTime();
		// Get keyword multiplier.
		const keywordModifier: number = this.getKeywordModifier();
		// TODO: Add multiplier for points. Points should be relative to overall points in that category for that class.

		this.assignment.basicEstimate = Math.floor(
			baseTime * keywordModifier * this.settings.estimateMultiplier[`course-${this.courseId}`]
		);
	}

	isAttendanceQuiz(): boolean {
		if (!this.assignment.submissionTypes.includes("online_quiz")) {
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
		const submissionBaseTimes: [string, number][] = [
			["online_upload", 60],
			["on_paper", 60],
			["discussion_topic", 30],
			["online_text_entry", 20],
			["online_quiz", 10]
		];

		for (const submissionBaseTime of submissionBaseTimes) {
			if (this.assignment.submissionTypes.includes(submissionBaseTime[0])) {
				return submissionBaseTime[1];
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

	historyEstimateTime(): number {
		return 0;
	}
}
