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
	shown: boolean; // Whether it will be shown.
	read: boolean; // For announcements only.
	basic_estimate: number | null;
	history_estimate: number | null;
	user_estimate: number | null;
	time_taken: number | null; // Time taken to complete the assignment
	// Data added by addExtraData in Course
	description: string = "";
	submission_types: string[] = [];
	// Added by the auto planner.
	priority: number = 0;
	// Just utils.
	utility: Utility = data.utility;

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
		shown: boolean,
		read: boolean,
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
		this.shown = shown;
		this.read = read;
		this.basic_estimate = basic_estimate;
		this.history_estimate = history_estimate;
		this.user_estimate = user_estimate;
		this.time_taken = time_taken;
	}

	makeElement(course?: Course): HTMLElement {
		const due_date: [string, string] = this.utility.formatDate(this.due_date, true);

		let link_type: string;
		let assignment_type: string;
		switch (this.type) {
			case "quiz":
				link_type = "quizzes";
				assignment_type = "type-quiz";
				break;
			case "discussion_topic":
				link_type = "discussion_topics";
				assignment_type = "type-discussion";
				break;
			case "calendar_event":
				link_type = "assignments";
				assignment_type = "type-event";
				break;
			default:
				link_type = "assignments";
				assignment_type = "type-assignment";
		}

		const link: string = `/courses/${this.course_id}/${link_type}/${this.id}`;

		let title: string;
		if (this.type !== "calendar_event") {
			title = `<a target="_blank" href="${link}" class="name">${this.name}</a>`;
		} else {
			title = `<p class="name">${this.name}</p>`;
		}

		if (!course) {
			course = data.courses!.find((course: Course): boolean => course.id === this.course_id);

			if (course === undefined) {
				this.utility.notify("error", "Course not found.");
				return document.createElement("li");
			}
		}

		let estimate: string | typeof NaN = this.utility.getEstimate(this, course);

		if (isNaN(Number(estimate))) {
			estimate = "TBD";
		}

		const assignmentData: string = `
			<li class="assignment cid-${this.course_id} aid-${this.id} ${assignment_type} ${this.shown ? "shown" : "collapsed"} ${this.submitted ? "completed" : ""}">
				${title}
				<p class="estimate-edit">
					<span class="estimate-label">Estimate: </span>
					<input class="estimate-input assignment-${this.id}" type="number" value="${estimate}" min="0" max="1440">
					<span class="estimate-time"> minutes</span>
				</p>
				<p class="estimate-label">Estimate: ${estimate}m</p>
				<div class="time-taken">
					<span title="How long it took you to complete the assignment. It is used for history based estimations.">Time taken: </span>
					<input class="time-taken-input assignment-${this.id}" type="number" value="${this.time_taken === null ? "" : this.time_taken.toString()}" min="0" max="1440">
					<span> minutes</span>
				</div>
				<p class="location">${this.location_name}</p>
				<div class="due-date">
					<span class="date">${due_date[0]}</span>
					<span class="time">${due_date[1]}</span>
					<span class="times">
						${
							this.start_date && this.end_date
								? `${this.utility.formatDate(this.start_date, true)[1]} - ${this.utility.formatDate(this.end_date, true)[1]}`
								: ""
						}
					</span>
				</div>
				<div class="visibility">
					<p class="expand">Expand</p>
					<p class="collapse">Collapse</p>
				</div>
			</li>
		`;

		const assignmentElement: HTMLElement = this.utility.convertHtml(assignmentData);

		// Add event listener for expanding/collapsing the assignment.
		const visibility: HTMLElement = assignmentElement.querySelector(".visibility")!;

		visibility.addEventListener("click", (): void => {
			assignmentElement.classList.toggle("collapsed");

			// Invert the value and save it.
			this.shown = !this.shown;
			course!.saveCourse();
		});

		return assignmentElement;
	}
}
