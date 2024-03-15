class Assignment {
	id: number;
	course_id: number;
	name: string;
	type: PlanableType;
	submitted: boolean;
	due_date: Date;
	start_date: Date | null;
	end_date: Date | null;
	points_possible: number | null;
	location_name: string;
	lock: boolean; // Lock to due date if it's time is unchangeable.
	planned: boolean;
	basic_estimate: number | null;
	history_estimate: number | null;
	user_estimate: number | null;
	time_taken: number | null; // Time taken to complete the assignment
	// Data added by addExtraData in Course
	description: string = "";
	submission_types: string[] = [];
	// Added by the auto planner.
	priority: number = 0;

	constructor(
		id: number,
		course_id: number,
		name: string,
		type: PlanableType,
		submitted: boolean,
		due_date: Date,
		start_date: Date | null,
		end_date: Date | null,
		points_possible: number | null,
		location_name: string,
		lock: boolean,
		planned: boolean,
		basic_estimate: number | null,
		history_estimate: number | null,
		user_estimate: number | null,
		time_taken: number | null
	) {
		this.id = id;
		this.course_id = course_id;
		this.name = name;
		this.type = type;
		this.submitted = submitted;
		this.due_date = due_date;
		this.start_date = start_date;
		this.end_date = end_date;
		this.points_possible = points_possible;
		this.location_name = location_name;
		this.lock = lock;
		this.planned = planned;
		this.basic_estimate = basic_estimate;
		this.history_estimate = history_estimate;
		this.user_estimate = user_estimate;
		this.time_taken = time_taken;
	}
}
