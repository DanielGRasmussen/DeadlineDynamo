class Planner {
	courses: Course[];
	utility: Utility;
	estimator: Estimator;
	settings!: SettingsJson;
	plan!: Plan;

	constructor(courses: Course[], estimator: Estimator, utility: Utility) {
		this.courses = courses;
		this.utility = utility;
		this.estimator = estimator;
		// Settings are used for various things, so we have to get them in ASAP.
		this.utility.loadSettings().then((settings: SettingsJson): void => {
			this.settings = settings;
		});
		this.plan = this.utility.loadPlan();

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

		// Add the weekday slots.
		this.addWeekdaySlots();
	}

	createSidebar(): void {
		const sidebarJson: HtmlElement = {
			element: "span",
			attributes: { class: "deadline-dynamo-sidebar" },
			children: [
				{
					element: "div",
					attributes: { class: "sidebar-close" },
					innerHTML: `
					<svg viewBox="0 0 1920 1920" width="1em" height="1em" aria-hidden="true" role="presentation" focusable="false" class="css-1uh2md0-inlineSVG-svgIcon" style="width: 1em; height: 1em;"><g role="presentation"><path d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z"></path></g></svg>
					`
				},
				{
					element: "div",
					attributes: { class: "sidebar-courses" }
				}
			]
		};

		const sidebar: HTMLElement = this.utility.createHtmlFromJson(sidebarJson);

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

		this.addAssignmentsToSidebar();

		// Dragula is now useful since the sidebar (where assignments are dragged to/from) is now created.
		this.addDragula();
	}

	deleteSidebar(): void {
		// Deletes the sidebar for when the X button is pressed.
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
	}

	addAssignmentsToSidebar(): void {
		for (const course of this.courses) {
			const courseElement: HtmlElement = {
				element: "div",
				attributes: { class: `sidebar-course ${course.id} collapsed` },
				children: [
					{
						element: "h4",
						attributes: { class: "course-name" },
						textContent: course.name
					},
					{
						element: "ul",
						attributes: { class: "course-assignments" }
					}
				]
			};

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

			// If there are no assignments, add a message saying so.
			let anyAssignments: boolean = false;
			for (const assignment of course.assignments) {
				// Make sure it is valid to be planned.
				if (!this.checkPlanAssignment(assignment)) {
					continue;
				}
				anyAssignments = true;

				const assignmentDiv: HTMLElement = this.makeAssignmentElement(assignment);

				assignmentList.appendChild(assignmentDiv);

				// Add event listener to save the user's estimate.
				const input: HTMLInputElement | null = assignmentDiv.querySelector(
					`input.assignment-${assignment.id}`
				);
				if (input === null) {
					this.utility.alerter("Error: Input not found.");
					return;
				}
				input.addEventListener("change", (): void => {
					this.saveUserEstimate(course, assignment, input.value);
				});
			}
			if (!anyAssignments) {
				const noAssignmentsElement: HtmlElement = {
					element: "li",
					attributes: { class: "no-assignments" },
					textContent: "No assignments to plan."
				};
				const noAssignments: HTMLElement =
					this.utility.createHtmlFromJson(noAssignmentsElement);

				assignmentList.appendChild(noAssignments);
			}
		}
	}

	makeAssignmentElement(assignment: Assignment): HTMLElement {
		let submissionType: string;
		if (assignment.submissionTypes.includes("online_quiz")) {
			submissionType = "quiz";
		} else if (assignment.submissionTypes.includes("discussion_topic")) {
			submissionType = "discussion";
		} else {
			submissionType = "assignment";
		}

		if (!assignment.dueDate.getDate) {
			assignment.dueDate = new Date(assignment.dueDate);
		}
		const due_date: [string, string] = this.utility.formatDate(assignment.dueDate);

		const assignmentElement: HtmlElement = {
			element: "li",
			attributes: {
				class: `sidebar-course ${assignment.courseId} ${assignment.id} ${submissionType}`
			},
			children: [
				{
					element: "a",
					attributes: { href: assignment.link, target: "_blank" },
					textContent: assignment.name
				},
				{
					element: "p",
					attributes: { class: "estimate-edit" },
					children: [
						{
							element: "span",
							attributes: { class: "estimate-label" },
							textContent: "Estimate: "
						},
						{
							element: "input",
							attributes: {
								class: `estimate-input assignment-${assignment.id}`,
								type: "number",
								value: this.utility.getEstimate(assignment, this.estimator),
								min: "0",
								max: "1440"
							}
						},
						{
							element: "span",
							attributes: { class: "estimate-time" },
							textContent: " minutes"
						}
					]
				},
				{
					element: "p",
					attributes: { class: "estimate-label" },
					textContent: `Estimate: ${this.utility.getEstimate(assignment, this.estimator)}m`
				},
				{
					element: "div",
					attributes: { class: "due-date" },
					children: [
						{
							element: "span",
							attributes: { class: "date" },
							textContent: due_date[0]
						},
						{
							element: "span",
							attributes: { class: "time" },
							textContent: due_date[1]
						}
					]
				}
			]
		};

		return this.utility.createHtmlFromJson(assignmentElement);
	}

	saveUserEstimate(course: Course, assignment: Assignment, estimate: string): void {
		assignment.userEstimate = parseInt(estimate);
		course.saveCourse();
	}

	checkPlanAssignment(assignment: Assignment): boolean {
		// Returns true if the assignment should be planned.

		// TODO: Figure out why assignments are being marked as submitted.
		// Tested at 10:30 PM Friday and assignments the next day were marked as submitted.
		// Checks if the assignment has any submissions.
		// if (assignment.submitted) {
		// 	// Filter out the assignment.
		// 	return false;
		// }

		// Check if the assignment is already planned.
		if (assignment.planned) {
			// Filter out the assignment.
			return false;
		}

		// Filter assignment to be within X weeks from this week's monday.
		// Get most recent monday.
		const today: Date = new Date();
		let monday: Date = new Date(today.setDate(today.getDate() - today.getDay() + 1));

		// Calculate x weeks from the Monday to determine where planning should end.
		const endDate: Date = new Date(
			monday.setDate(monday.getDate() + this.settings.planDistance * 7)
		);
		// Creating the new date sets the one used in it, so we need to reset monday to be monday.
		monday = new Date(today);

		// Check if assignment is before monday or after the end date.
		return !(assignment.dueDate < monday || assignment.dueDate > endDate);
	}

	addDragula(): void {
		const assignment_containers: NodeListOf<HTMLElement> = document.querySelectorAll(
			".weekday-assignments, .course-assignments"
		);
		const containers: HTMLElement[] = Array.from(assignment_containers);

		// @ts-expect-error - Dragula is defined in the dragula package.
		const drake = dragula(containers, {
			revertOnSpill: true,
			invalid: (el: HTMLElement, handle: never) => el.classList.contains("no-assignments")
		});

		// TODO: Modify settings.
		drake.on(
			"drop",
			(el: HTMLElement, target: HTMLElement, source: never, sibling: never): void => {
				if (target.classList.contains("weekday-assignments")) {
					// Gets course and assignment id so we can find the assignment.
					const course_id: number = parseInt(el.classList[1]);
					const assignment_id: number = parseInt(el.classList[2]);

					// Find the course.
					const course: Course | undefined = this.courses.find(
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

					// Add the assignment to the plan.
					console.log(target.classList[1]);
					const target_day: string = target.classList[1];
					let target_day_plan: Assignment[] = this.plan[target_day];

					if (target_day_plan === undefined) {
						target_day_plan = [];
					}

					target_day_plan.push(assignment);
					this.plan[target_day] = target_day_plan;
					this.utility.saveStorage("plan", JSON.stringify(this.plan));

					// Update the assignment info
					assignment.planned = true;
					course.saveCourse();
				}
			}
		);
	}

	addWeekdaySlots(): void {
		// Adds the empty weekday slots to the main UI of the planner.
		const planner: HTMLElement | null = document.getElementById("deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		// Get the first day of the week.
		const today: Date = new Date();
		const monday: Date = new Date(today.setDate(today.getDate() - today.getDay() + 1));

		// Add the slots for each day of the week.
		for (let i = 0; i < 7; i++) {
			const day: Date = new Date(monday);
			day.setDate(day.getDate() + i);

			const dayElement: HtmlElement = {
				element: "div",
				attributes: { class: "weekday" },
				children: [
					{
						element: "h3",
						attributes: { class: "weekday-name" },
						textContent: this.utility.formatDate(day)[0]
					},
					{
						element: "ul",
						attributes: {
							class: `weekday-assignments ${day.toISOString().slice(0, 10)}`
						}
					}
				]
			};

			const dayDiv: HTMLElement = this.utility.createHtmlFromJson(dayElement);

			planner.appendChild(dayDiv);

			// Add the assignments planned for that day.
			const currentPlan: Assignment[] | undefined = this.plan[day.toISOString().slice(0, 10)];

			if (currentPlan !== undefined) {
				currentPlan.forEach((assignment: Assignment): void => {
					const assignmentDiv: HTMLElement = this.makeAssignmentElement(assignment);

					const weekdayAssignments: HTMLElement | null =
						dayDiv.querySelector(".weekday-assignments");

					if (weekdayAssignments === null) {
						this.utility.alerter("Error: Weekday assignments not found.");
						return;
					}

					weekdayAssignments.appendChild(assignmentDiv);
				});
			} else {
				// The day has no assignments planned.
				const noAssignmentsElement: HtmlElement = {
					element: "li",
					attributes: { class: "no-assignments" },
					textContent: "No assignments planned."
				};
				const noAssignments: HTMLElement =
					this.utility.createHtmlFromJson(noAssignmentsElement);

				const weekdayAssignments: HTMLElement | null =
					dayDiv.querySelector(".weekday-assignments");

				if (weekdayAssignments === null) {
					this.utility.alerter("Error: Weekday assignments not found.");
					return;
				}

				weekdayAssignments.appendChild(noAssignments);
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
}
