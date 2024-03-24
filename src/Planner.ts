class Planner {
	main!: Main;
	courses: Course[] | undefined;
	utility!: Utility;
	estimator!: Estimator;
	settings!: SettingsJson;
	plan!: Plan;
	conditions!: boolean[];

	constructor(main: Main, conditions: boolean[]) {
		this.start(main, conditions);
	}

	async start(main: Main, conditions: boolean[]): Promise<void> {
		this.main = main;
		this.utility = main.utility;
		this.estimator = main.estimator;
		this.conditions = conditions;
		// Settings are used for various things, so we have to get them in ASAP.
		this.settings = await this.utility.loadSettings();
		this.plan = await this.utility.loadPlan();

		let triggeredHeader: boolean = false;
		let triggeredAnnouncements: boolean = false;
		let triggeredMain: boolean = false;

		for (let i = 0; i < 20; i++) {
			await this.utility.wait(500);

			if (this.main.courses.length !== 0) {
				this.courses = this.main.courses;
			}

			if (!triggeredHeader && this.conditions[0]) {
				this.utility.log("Creating sidebar button.");
				// Check on if our sidebar pullout button is there. It should be.
				const sidebar_button: Element | null = document.querySelector(
					".deadline-dynamo-sidebar-button"
				);

				if (sidebar_button === null) {
					this.utility.alerter("Error: Sidebar button not found.");
					return;
				}

				// Add the event listener to create the sidebar when the button is clicked.
				sidebar_button.addEventListener("click", this.createSidebar.bind(this));

				triggeredHeader = true;
			}
			if (
				!triggeredAnnouncements &&
				this.conditions[0] &&
				this.conditions[1] &&
				this.courses?.length !== 0
			) {
				this.utility.log("Creating announcements.");
				// Check if our announcement button is there. It should be.
				const announcement_container: Element | null = document.querySelector(
					".announcement-button .announcement-container"
				);

				if (announcement_container === null) {
					this.utility.alerter("Error: Announcement button not found.");
					return;
				}

				// Populate the list of announcements.
				this.createAnnouncements(announcement_container);

				triggeredAnnouncements = true;
			}
			if (this.conditions[1] && this.courses?.length !== 0 && !triggeredMain) {
				this.utility.log("Creating planner.");
				// Add the weekday slots.
				this.addWeekdaySlots();

				// Scroll down to current day.
				this.utility.scrollToToday();

				triggeredMain = true;
			}
		}
	}

	createSidebar(): void {
		// Check if the sidebar is already open.
		this.utility.log("Creating sidebar.");
		const planner: HTMLElement | null = document.getElementById("deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		if (planner.classList.contains("sidebar-open")) {
			return;
		}

		const sidebarHTML: string = `
			<span class="deadline-dynamo-sidebar">
				<div class="sidebar-header">
					<div class="sidebar-close">
						<svg viewBox="0 0 1920 1920" width="1em" height="1em" aria-hidden="true" role="presentation" focusable="false" class="css-1uh2md0-inlineSVG-svgIcon" style="width: 1em; height: 1em;"><g role="presentation"><path d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z"></path></g></svg>
					</div>
					<div class="show-toggle">
						<label for="sidebar-show-complete">Show completed: </label>
						<input type="checkbox" class="sidebar-show-complete" id="sidebar-show-complete">
					</div>
					<button class="plan btn btn-primary">Auto-plan</button>
				</div>
				<div class="sidebar-courses"></div>
			</span>
		`;

		const sidebar: HTMLElement = this.utility.createHtmlFromJson(sidebarHTML);

		// This is the element that the default pullout sidebars are placed by, so we will do the same.
		const sidebarSibling: HTMLElement | null = document.getElementById("nav-tray-portal");

		if (sidebarSibling === null) {
			this.utility.alerter("Error: Sidebar sibling not found.");
			return;
		}

		sidebarSibling.after(sidebar);

		// Set up the close button.
		const closeButton: HTMLElement | null = document.querySelector(".sidebar-close");

		if (closeButton === null) {
			this.utility.alerter("Error: Sidebar close button not found.");
			return;
		}

		closeButton.addEventListener("click", this.deleteSidebar.bind(this));

		// Set up the plan button.
		const planButton: HTMLElement | null = document.querySelector(".plan");

		if (planButton === null) {
			this.utility.alerter("Error: Plan button not found.");
			return;
		}

		planButton.addEventListener("click", (): void => {
			this.plan = this.utility.createPlan(
				this.plan,
				this.courses!,
				this.estimator,
				this.settings
			);
			this.utility.saveStorage("plan", JSON.stringify(this.plan));
		});

		this.addAssignmentsToSidebar();

		// Dragula is now useful since the sidebar (where assignments are dragged to/from) is now created.
		this.addDragula();

		// Add the "sidebar-open" class so stuff is draggable.
		planner.classList.add("sidebar-open");
	}

	deleteSidebar(): void {
		// Deletes the sidebar for when the X button is pressed.
		this.utility.log("Deleting sidebar.");
		const sidebar: HTMLElement | null = document.querySelector(".deadline-dynamo-sidebar");

		if (sidebar === null) {
			this.utility.alerter("Error: Sidebar not found.");
			return;
		}

		// Remove the sidebar after a short delay to allow the close animation to play.
		sidebar.classList.add("slide-out");

		setTimeout(
			(sidebar: HTMLElement): void => {
				sidebar.remove();
			},
			// Time it takes for the animation to play.
			450,
			sidebar
		);

		// Remove the "sidebar-open" class so stuff isn't draggable.
		const planner: HTMLElement | null = document.getElementById("deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		planner.classList.remove("sidebar-open");
	}

	addAssignmentsToSidebar(previous: boolean = false, offset: number = 0): void {
		this.utility.log("Adding assignments to sidebar.");
		if (!this.courses) {
			this.utility.alerter("Error: Courses not found.");
			return;
		}
		for (const course of this.courses) {
			const courseElement: string = `
				<div class="sidebar-course cid-${course.id} collapsed">
					<h4 class="course-name">${course.name}</h4>
					<ul class="course-assignments">
					</ul>
				</div>
			`;

			const courseDiv: HTMLElement = this.utility.createHtmlFromJson(courseElement);

			// Make the course name clickable to collapse the course.
			const courseName: HTMLElement | null = courseDiv.querySelector(".course-name");

			if (courseName === null) {
				this.utility.alerter("Error: Course name not found.");
				return;
			}

			courseName.addEventListener("click", (mouseEvent: MouseEvent): void => {
				if (
					!mouseEvent.target ||
					!(mouseEvent.target instanceof HTMLElement) ||
					!mouseEvent.target.parentElement
				) {
					this.utility.alerter("Error: Can't add hook to collapse course list.");
					return;
				}
				mouseEvent.target.parentElement.classList.toggle("collapsed");
			});

			// Parent container of all assignments added by this.createSidebar.
			const sidebarCourses: HTMLElement | null = document.querySelector(".sidebar-courses");

			if (sidebarCourses === null) {
				this.utility.alerter("Error: Sidebar courses not found.");
				return;
			}

			sidebarCourses.appendChild(courseDiv);

			const assignmentList: HTMLElement | null =
				courseDiv.querySelector(".course-assignments");

			if (assignmentList === null) {
				// If this is ever hit, I must've removed something from earlier in this function.
				this.utility.alerter("Error: Assignment list not found.");
				return;
			}

			for (const assignment of course.assignments) {
				// Make sure it is valid to be planned.
				if (!this.checkPlanAssignment(assignment)) {
					continue;
				}

				const assignmentDiv: HTMLElement = this.makeAssignmentElement(assignment, course);

				assignmentList.appendChild(assignmentDiv);

				// Add event listener to save the user's estimate.
				const estimateInput: HTMLInputElement | null = assignmentDiv.querySelector(
					`.estimate-input.assignment-${assignment.id}`
				);

				if (estimateInput === null) {
					this.utility.alerter("Error: Input not found.");
					return;
				}

				estimateInput.addEventListener("change", (): void => {
					this.saveValue(course, assignment, estimateInput.value, true);
				});

				// Add event listener to save the time taken.
				const timeTakenInput: HTMLInputElement | null = assignmentDiv.querySelector(
					`.time-taken-input.assignment-${assignment.id}`
				);

				if (timeTakenInput === null) {
					this.utility.alerter("Error: Input not found.");
					return;
				}

				timeTakenInput.addEventListener("change", (): void => {
					this.saveValue(course, assignment, timeTakenInput.value, false);
				});
			}
		}
	}

	makeAssignmentElement(assignment: Assignment, course?: Course): HTMLElement {
		const due_date: [string, string] = this.utility.formatDate(assignment.due_date);

		let link_type: string;
		switch (assignment.type) {
			case "quiz":
				link_type = "quizzes";
				break;
			case "discussion_topic":
				link_type = "discussion_topics";
				break;
			default:
				link_type = "assignments";
		}

		const link: string = `/courses/${assignment.course_id}/${link_type}/${assignment.id}`;

		if (!course) {
			course = this.courses!.find(
				(course: Course): boolean => course.id === assignment.course_id
			);

			if (course === undefined) {
				this.utility.alerter("Error: Course not found.");
				return document.createElement("div");
			}
		}

		const estimate: string = this.utility.getEstimate(
			course,
			assignment,
			this.estimator,
			this.settings
		);

		const assignmentData: string = `
			<li class="assignment cid-${assignment.course_id} aid-${assignment.id} type-${assignment.type} ${assignment.shown ? "shown" : "collapsed"} ${assignment.submitted ? "completed" : ""}">
				<a target="_blank" href="${link}">${assignment.name}</a>
				<p class="estimate-edit">
					<span class="estimate-label">Estimate: </span>
					<input class="estimate-input assignment-${assignment.id}" type="number" value="${estimate}" min="0" max="1440">
					<span class="estimate-time"> minutes</span>
				</p>
				<p class="estimate-label">Estimate: ${estimate}m</p>
				<div class="time-taken">
					<span title="How long it took you to complete the assignment. It is used for history based estimations.">Time taken: </span>
					<input class="time-taken-input assignment-${assignment.id}" type="number" value="${assignment.time_taken === null ? "" : assignment.time_taken.toString()}" min="0" max="1440">
					<span> minutes</span>
				</div>
				<p class="location">${assignment.location_name}</p>
				<div class="due-date">
					<span class="date">${due_date[0]}</span>
					<span class="time">${due_date[1]}</span>
					<span class="times">
						${assignment.start_date && assignment.end_date ? `${this.utility.formatDate(assignment.start_date)[1]} - ${this.utility.formatDate(assignment.end_date)[1]}` : ""}
					</span>
				</div>
				<div class="visibility">
					<p class="expand">Expand</p>
					<p class="collapse">Collapse</p>
				</div>
			</li>
		`;

		const assignmentElement: HTMLElement = this.utility.createHtmlFromJson(assignmentData);

		// Add event listener for expanding/collapsing the assignment.
		const visibility: HTMLElement = assignmentElement.querySelector(".visibility")!;

		visibility.addEventListener("click", (): void => {
			assignmentElement.classList.toggle("collapsed");

			// Invert the value and save it.
			assignment.shown = !assignment.shown;
			course!.saveCourse();
		});

		return assignmentElement;
	}

	saveValue(course: Course, assignment: Assignment, value: string, is_estimate: boolean): void {
		if (is_estimate) {
			assignment.user_estimate = parseInt(value);
		} else {
			assignment.time_taken = parseInt(value);
		}
		course.saveCourse();
	}

	checkPlanAssignment(assignment: Assignment): boolean {
		// Returns true if the assignment should be planned.

		return !(
			// Already planned assignments don't need to be planned.
			(
				assignment.planned ||
				// Locked assignments are moved into the planner elsewhere.
				assignment.lock ||
				// Announcements aren't in the base planner.
				assignment.type === "announcement"
			)
		);
	}

	addDragula(): void {
		const assignment_containers: NodeListOf<HTMLElement> = document.querySelectorAll(
			".weekday-assignments, .course-assignments, .sidebar-courses"
		);
		const containers: HTMLElement[] = Array.from(assignment_containers);

		this.utility.log("Adding dragula.");

		// @ts-expect-error - Dragula is defined in the dragula package.
		const drake = dragula(containers, {
			revertOnSpill: true,
			invalid: (el: HTMLElement, _: never) => {
				const planner: HTMLElement | null =
					document.getElementById("deadline-dynamo-planner");

				return (
					// Don't drag the planning elements.
					el.parentElement?.classList.contains("sidebar-courses") ||
					// Don't allow dragging if the sidebar isn't shown.
					!planner?.classList.contains("sidebar-open") ||
					// Don't allow dragging if the assignment is locked.
					el.classList.contains("locked")
				);
			}
		});

		drake.on("drop", (el: HTMLElement, target: HTMLElement, source: never, _: never): void => {
			// Gets course and assignment id to allow us to find the assignment.
			// They have identifiers of "cid-#" and "aid-#" respectively.
			const course_id: number = parseInt(el.classList[1].substring(4));
			const assignment_id: number = parseInt(el.classList[2].substring(4));

			// Find the course.
			const course: Course | undefined = this.courses!.find(
				(course: Course): boolean => course.id === course_id
			);

			if (course === undefined) {
				this.utility.alerter("Error: Course not found.");
				return;
			}

			// Find the assignment.
			const assignment: Assignment | undefined = course.assignments.find(
				(assignment: Assignment): boolean => assignment.id === assignment_id
			);

			if (assignment === undefined) {
				this.utility.alerter("Error: Assignment not found.");
				return;
			}

			// Remove the assignment from the plan.
			for (const day in this.plan) {
				if (this.plan[day] !== undefined) {
					this.plan[day] = this.plan[day].filter(
						(planItem: PlanItem): boolean => planItem.id !== assignment.id
					);
				}
			}

			if (target.classList.contains("weekday-assignments")) {
				// The assignment is being moved to the planner.

				// Add the assignment to the plan.
				const target_day: string = target.classList[1];
				let target_day_plan: PlanItem[] = this.plan[target_day];

				if (target_day_plan === undefined) {
					target_day_plan = [];
				}

				const planItem: PlanItem = {
					id: assignment.id,
					due_date: assignment.due_date
				};

				target_day_plan.push(planItem);
				this.plan[target_day] = target_day_plan;

				// If the is being planned for after it's due date send an alert.
				if (new Date(target_day) > new Date(assignment.due_date)) {
					this.utility.alerter(
						`Warning: ${assignment.name} is being planned for after it's due date.`
					);
				}

				// Update the assignment info
				assignment.planned = true;
			} else {
				// The assignment is being moved back to the sidebar.
				// The two places it can be dropped to trigger this is the overall sidebar or an individual
				// course's segment in the sidebar.

				// Get course it is supposed to move to.
				const target_course: HTMLElement | null = document.querySelector(
					`div.sidebar-course.cid-${course_id} .course-assignments`
				);

				if (target_course === null) {
					this.utility.alerter("Error: Target course not found.");
					return;
				}
				const new_element: HTMLElement = el.cloneNode(true) as HTMLElement;
				new_element?.classList.remove("gu-transit");

				target_course?.firstChild?.before(new_element);

				// Hide the original element.
				el.classList.add("hidden");

				// Update the assignment info
				assignment.planned = false;
			}

			this.utility.saveStorage("plan", JSON.stringify(this.plan));
			course.saveCourse();
		});
	}

	createAnnouncements(announcement_container: Element): void {
		// Adds the announcements to the container
		this.utility.log("Creating announcements.");
		// Get list of announcements
		const announcements: Assignment[] = this.courses!.flatMap(
			(course: Course): Assignment[] => course.assignments
		).filter((assignment: Assignment): boolean => assignment.type === "announcement");

		// Sort the announcements by date.
		const sortedAnnouncements: Assignment[] = announcements.sort(
			(a: Assignment, b: Assignment): number => {
				if (a.due_date < b.due_date) {
					return 1;
				}
				if (a.due_date > b.due_date) {
					return -1;
				}
				return 0;
			}
		);

		// Add the announcements to the container
		for (const announcement of sortedAnnouncements) {
			// Get course name
			const course: Course | undefined = this.courses!.find((course: Course): boolean => {
				return course.id === announcement.course_id;
			});

			if (course === undefined) {
				this.utility.alerter("Error: Course not found.");
				return;
			}

			const announcementDate: string[] = this.utility.formatDate(announcement.due_date);

			const link: string = `/courses/${announcement.course_id}/discussion_topics/${announcement.id}`;

			const announcementData: string = `
				<div class="announcement">
					<a target="_blank" title="${announcement.name}" href="${link}">${announcement.name}</a>
					<p class="course">${course.code}</p>
					<p class="date">${announcementDate[0]} ${announcementDate[1]}</p>
				</div>
			`;

			const announcementDiv: HTMLElement = this.utility.createHtmlFromJson(announcementData);
			announcement_container.appendChild(announcementDiv);
		}
	}

	addWeekdaySlots(previous: boolean = false, offset: number = 0): void {
		// Adds the empty weekday slots to the main UI of the planner.
		this.utility.log("Adding weekday slots.");
		const planner: HTMLElement | null = document.getElementById("deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		const sibling: ChildNode | null = planner.firstChild;

		// Get the first day of the week.
		const monday: Date = this.utility.getMonday(new Date(), offset);

		// Add the slots for each day of the week.
		for (let i = 0; i < 7 * this.settings.planDistance; i++) {
			const day: Date = new Date(monday);
			day.setDate(day.getDate() + i);

			const dayElement: string = `
				<div class="weekday">
					<h3 class="weekday-name">${this.utility.formatDate(day)[0]}</h3>
					<ul class="weekday-assignments ${day.toISOString().slice(0, 10)}"></ul>
				</div>
			`;

			const dayDiv: HTMLElement = this.utility.createHtmlFromJson(dayElement);

			if (!previous) {
				planner.appendChild(dayDiv);
			} else {
				sibling?.before(dayDiv);
			}
			// Add locked assignments for that day.
			this.addLockedAssignments(day, dayDiv);

			// Add the assignments planned for that day.
			const currentPlan: PlanItem[] | undefined = this.plan[day.toISOString().slice(0, 10)];

			if (currentPlan !== undefined) {
				currentPlan.forEach((planItem: PlanItem): void => {
					const assignment: Assignment | undefined = this.courses!.flatMap(
						(course: Course): Assignment[] => course.assignments
					).find((assignment: Assignment): boolean => assignment.id === planItem.id);

					if (assignment === undefined) {
						this.utility.alerter("Error: Assignment not found.");
						return;
					}

					const assignmentDiv: HTMLElement = this.makeAssignmentElement(assignment);

					const weekdayAssignments: HTMLElement | null =
						dayDiv.querySelector(".weekday-assignments");

					if (weekdayAssignments === null) {
						this.utility.alerter("Error: Weekday assignments not found.");
						return;
					}

					weekdayAssignments.appendChild(assignmentDiv);
				});
			}
		}

		// Hide the spinner now that the planner is done loading.
		const spinner: HTMLElement | null = document.querySelector(".deadline-dynamo-spinner");
		if (spinner === null) {
			this.utility.alerter("Error: Spinner not found.");
			return;
		}

		spinner.classList.add("hidden");
	}

	addLockedAssignments(day: Date, dayDiv: HTMLElement): void {
		// Adds the locked assignments for the day.
		this.utility.log("Adding locked assignments.");
		const showEvents: boolean = this.settings.showEvents;
		const lockedAssignments: Assignment[] = this.courses!.flatMap(
			(course: Course): Assignment[] => course.assignments
		).filter((assignment: Assignment): boolean => {
			return (
				// It has to be locked
				assignment.lock &&
				// It can't be a calendar event if we're not showing them.
				(showEvents || assignment.type !== "calendar_event") &&
				// It can't be an announcement.
				assignment.type !== "announcement" &&
				// It has to be due on the day we're looking at.
				this.utility.formatDate(assignment.due_date)[0] === this.utility.formatDate(day)[0]
			);
		});

		lockedAssignments.forEach((assignment: Assignment): void => {
			const assignmentDiv: HTMLElement = this.makeAssignmentElement(assignment);
			assignmentDiv.classList.add("locked");

			const weekdayAssignments: HTMLElement | null =
				dayDiv.querySelector(".weekday-assignments");

			if (weekdayAssignments === null) {
				this.utility.alerter("Error: Weekday assignments not found.");
				return;
			}

			weekdayAssignments.appendChild(assignmentDiv);
		});
	}
}
