class Assignment {
	id: number;
	course_id: number;
	name: string;
	type: PlannableType;
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

	constructor(
		id: number,
		course_id: number,
		name: string,
		type: PlannableType,
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
		const due_date: [string, string] = utility.formatDate(this.due_date, true);

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

		const target: string = g_settings.openInNewTab ? "target='_blank'" : "";

		let title: string;
		if (this.type !== "calendar_event") {
			title = `<a ${target} href="${link}" class="name">${this.name}</a>`;
		} else {
			title = `<p class="name">${this.name}</p>`;
		}

		if (!course) {
			course = data.courses!.find((course: Course): boolean => course.id === this.course_id);

			if (course === undefined) {
				utility.notify("error", "Course not found.");
				return document.createElement("li");
			}
		}

		const estimate: string | typeof NaN = utility.getEstimate(this, course);

		let estimate_label_value: string;
		let estimate_input_value: string;
		if (isNaN(Number(estimate))) {
			estimate_label_value = "TBD";
			estimate_input_value = "";
		} else {
			estimate_label_value = `${estimate}m`;
			estimate_input_value = estimate;
		}

		const assignmentData: string = `
			<li class="assignment cid-${this.course_id} aid-${this.id} ${assignment_type} ${this.shown ? "shown" : "collapsed"} ${this.submitted ? "completed" : ""}">
				${title}
				<p class="estimate-edit">
					<span>Estimate: </span>
					<input class="estimate-input assignment-${this.id}" type="number" value="${estimate_input_value}" min="0" max="1440">
					<span> minutes</span>
				</p>
				<p class="estimate-label">Estimate: ${estimate_label_value}</p>
				<div class="time-taken-edit">
					<span title="How long it took you to complete the assignment. It is used for history based estimations.">Time taken: </span>
					<input class="time-taken-input assignment-${this.id}" type="number" value="${this.time_taken === null ? "" : this.time_taken.toString()}" min="0" max="1440">
					<span> minutes</span>
				</div>
				<p class="time-taken-label">
					${this.time_taken === null ? "Time taken: TBD" : `Time taken: ${this.time_taken}m`}
				</p>
				<p class="location">${this.location_name}</p>
				<div class="due-date">
					<span class="date">${due_date[0]}</span>
					<span class="time">${due_date[1]}</span>
					<span class="times">
						${
							this.start_date && this.end_date
								? `${utility.formatDate(this.start_date, true)[1]} - ${utility.formatDate(this.end_date, true)[1]}`
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

		const assignmentElement: HTMLElement = utility.convertHtml(assignmentData);

		// Add event listener for expanding/collapsing the assignment.
		const visibility: HTMLElement = assignmentElement.querySelector(".visibility")!;

		visibility.addEventListener("click", (): void => {
			assignmentElement.classList.toggle("collapsed");

			// Invert the value and save it.
			this.shown = !this.shown;
			course!.saveCourse();
		});

		// Add event listener for editing the items.
		const estimate_label: HTMLElement = assignmentElement.querySelector("p.estimate-label")!;
		const time_taken_label: HTMLElement =
			assignmentElement.querySelector("p.time-taken-label")!;
		estimate_label.addEventListener("click", (event: MouseEvent): void => {
			this.addEditing(assignmentElement, event);
		});
		time_taken_label.addEventListener("click", (event: MouseEvent): void => {
			this.addEditing(assignmentElement, event);
		});

		// Add event listener to get rid of the editing class.
		const estimate_edit: HTMLElement = assignmentElement.querySelector("p.estimate-edit")!;
		estimate_edit.addEventListener("click", (event: MouseEvent): void => {
			if ((event.target as Node)?.nodeName === "INPUT") {
				return;
			}
			assignmentElement.classList.remove("editing");

			let estimate: string | typeof NaN = utility.getEstimate(this, course!);

			if (isNaN(Number(estimate))) {
				estimate = "TBD";
			} else {
				estimate += "m";
			}

			utility.log(`Updating estimate to ${estimate}`);

			estimate_label.textContent = `Estimate: ${estimate}`;
		});

		const time_taken_edit: HTMLElement =
			assignmentElement.querySelector("div.time-taken-edit")!;
		time_taken_edit.addEventListener("click", (event): void => {
			if ((event.target as Node)?.nodeName === "INPUT") {
				return;
			}
			assignmentElement.classList.remove("editing");

			const time_taken_value: string = (
				time_taken_edit.querySelector("input") as HTMLInputElement
			).value;

			utility.log(`Updating time taken to ${time_taken_value}m`);

			time_taken_label.textContent =
				this.time_taken === null ? "Time taken: TBD" : `Time taken: ${time_taken_value}m`;
		});

		// Add event listener to save the user's estimate.
		const estimateInput: HTMLInputElement | null = assignmentElement.querySelector(
			`.estimate-input.assignment-${this.id}`
		)!;

		estimateInput.addEventListener("change", (): void => {
			this.user_estimate = parseInt(estimateInput.value);
			course!.saveCourse();
		});

		// Add event listener to save the time taken.
		const timeTakenInput: HTMLInputElement | null = assignmentElement.querySelector(
			`.time-taken-input.assignment-${this.id}`
		)!;

		timeTakenInput.addEventListener("change", (): void => {
			this.time_taken = parseInt(timeTakenInput.value);
			course!.saveCourse();
		});

		return assignmentElement;
	}

	addEditing(assignmentElement: HTMLElement, event: MouseEvent): void {
		if ((event.target as Node)?.nodeName === "INPUT") {
			return;
		}
		utility.log("Adding editing class to assignment.");
		assignmentElement.classList.add("editing");
	}
}
