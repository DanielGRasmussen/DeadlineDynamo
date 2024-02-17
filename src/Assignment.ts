class Assignment {
	id: number;
	courseId: number;
	name: string;
	submitted: boolean;
	dueDate: Date;
	unlockAt: Date | null;
	description: string | null;
	submissionTypes: string[];
	allowedExtensions: string[];
	pointsPossible: number;
	link: string;
	lock: boolean; // Lock to due date if it's time is unchangeable.
	planned: boolean;
	basicEstimate: number | null;
	historyEstimate: number | null;
	userEstimate: number | null;
	priorityValue?: number | null;
	percComplete: number = 0;

	constructor(
		id: number,
		courseId: number,
		name: string,
		submitted: boolean,
		dueDate: Date,
		unlockAt: Date | null,
		description: string,
		submissionTypes: string[],
		allowedExtensions: string[],
		pointsPossible: number,
		link: string,
		lock: boolean,
		planned: boolean,
		basicEstimate: number | null,
		historyEstimate: number | null,
		userEstimate: number | null
	) {
		this.id = id;
		this.courseId = courseId;
		this.name = name;
		this.submitted = submitted;
		this.dueDate = dueDate;
		this.unlockAt = unlockAt;
		this.description = description;
		this.submissionTypes = submissionTypes;
		this.allowedExtensions = allowedExtensions;
		this.pointsPossible = pointsPossible;
		this.link = link;
		this.lock = lock;
		this.planned = planned;
		this.basicEstimate = basicEstimate;
		this.historyEstimate = historyEstimate;
		this.userEstimate = userEstimate;
	}
}
