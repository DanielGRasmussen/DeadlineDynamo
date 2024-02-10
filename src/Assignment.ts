class Assignment {
	id: number;
	name: string;
	submitted: boolean;
	dueDate: Date;
	unlockAt: Date | null;
	description: string | null;
	submissionTypes: string[];
	allowedExtensions: string[];
	pointsPossible: number;
	link: string;
	lock: boolean = false; // Lock to due date.
	basicEstimate?: number | null;
	historyEstimate?: number | null;
	priorityValue?: number | null;
	percComplete: number = 0;

	constructor(
		id: number,
		name: string,
		submitted: boolean,
		dueDate: Date,
		unlockAt: Date | null,
		description: string,
		submissionTypes: string[],
		allowedExtensions: string[],
		pointsPossible: number,
		link: string
	) {
		this.id = id;
		this.name = name;
		this.submitted = submitted;
		this.dueDate = dueDate;
		this.unlockAt = unlockAt;
		this.description = description;
		this.submissionTypes = submissionTypes;
		this.allowedExtensions = allowedExtensions;
		this.pointsPossible = pointsPossible;
		this.link = link;
	}
}
