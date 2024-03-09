class Planner {
	courses!: Course[];
	utility!: Utility;
	estimator!: Estimator;
	settings!: SettingsJson;
	plan!: Plan;

	constructor(courses: Course[], estimator: Estimator, utility: Utility) {
		this.main(courses, estimator, utility);
	}

	async main(courses: Course[], estimator: Estimator, utility: Utility): Promise<void> {
		this.courses = courses;
		this.utility = utility;
		this.estimator = estimator;
		// Settings are used for various things, so we have to get them in ASAP.
		this.settings = await this.utility.loadSettings();
		this.plan = await this.utility.loadPlan();

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
					attributes: { class: "sidebar-header" },
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
							attributes: { class: "show-toggle" },
							children: [
								{
									element: "label",
									attributes: { for: "sidebar-show-complete" },
									textContent: "Show completed: "
								},
								{
									element: "input",
									attributes: {
										type: "checkbox",
										class: "sidebar-show-complete",
										id: "sidebar-show-complete"
									}
								}
							]
						},
						{
							element: "button",
							attributes: { class: "plan btn btn-primary" },
							textContent: "Auto-plan"
						}
					]
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

		// Remove the "sidebar-hidden" class to make stuff draggable.
		const planner: HTMLElement | null = document.getElementById("deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		planner.classList.remove("sidebar-hidden");
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

		// Add the "sidebar-hidden" class to the planner to make stuff unmovable again.
		const planner: HTMLElement | null = document.getElementById("deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		planner.classList.add("sidebar-hidden");
	}

	addAssignmentsToSidebar(): void {
		for (const course of this.courses) {
			const courseElement: HtmlElement = {
				element: "div",
				attributes: { class: `sidebar-course cid-${course.id} collapsed` },
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
				this.addNoAssignmentsMessage(assignmentList);
			}
		}
	}

	makeAssignmentElement(assignment: Assignment): HTMLElement {
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

		const assignmentElement: HtmlElement = {
			element: "li",
			attributes: {
				// Add the "completed" class if the assignment is completed.
				class: `sidebar-course cid-${assignment.course_id} aid-${assignment.id} ${assignment.type} ${assignment.submitted ? "completed" : ""}`
			},
			children: [
				{
					element: "a",
					attributes: { href: link, target: "_blank" },
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
					element: "p",
					attributes: { class: "location" },
					textContent: assignment.location_name
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
						},
						{
							element: "span",
							attributes: { class: "times" },
							textContent:
								assignment.start_date && assignment.end_date
									? `${this.utility.formatDate(assignment.start_date)[1]} - ${this.utility.formatDate(assignment.end_date)[1]}`
									: ""
						}
					]
				}
			]
		};

		return this.utility.createHtmlFromJson(assignmentElement);
	}

	saveUserEstimate(course: Course, assignment: Assignment, estimate: string): void {
		assignment.user_estimate = parseInt(estimate);
		course.saveCourse();
	}

	checkPlanAssignment(assignment: Assignment): boolean {
		// Returns true if the assignment should be planned.

		if (
			// Already planned assignments don't need to be planned.
			assignment.planned ||
			// Locked assignments are moved into the planner elsewhere.
			assignment.lock ||
			// Announcements aren't in the base planner.
			assignment.type === "announcement"
		) {
			return false;
		}

		return true;
	}

	addDragula(): void {
		const assignment_containers: NodeListOf<HTMLElement> = document.querySelectorAll(
			".weekday-assignments, .course-assignments, .sidebar-courses"
		);
		const containers: HTMLElement[] = Array.from(assignment_containers);

		// @ts-expect-error - Dragula is defined in the dragula package.
		const drake = dragula(containers, {
			revertOnSpill: true,
			invalid: (el: HTMLElement, _: never) => {
				const planner: HTMLElement | null =
					document.getElementById("deadline-dynamo-planner");

				return (
					// Don't allow dragging if the assignment is already planned.
					el.classList.contains("no-assignments") ||
					// Don't drag the planning elements.
					el.parentElement?.classList.contains("sidebar-courses") ||
					// Don't allow dragging if the sidebar is hidden.
					planner?.classList.contains("sidebar-hidden") ||
					// Don't allow dragging if the assignment is locked.
					el.classList.contains("locked")
				);
			}
		});

		drake.on(
			"drop",
			(el: HTMLElement, target: HTMLElement, source: HTMLElement, _: never): void => {
				// Gets course and assignment id to allow us to find the assignment.
				// They have identifiers of "cid-#" and "aid-#" respectively.
				const course_id: number = parseInt(el.classList[1].substring(4));
				const assignment_id: number = parseInt(el.classList[2].substring(4));

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

				// Remove the assignment from the plan.
				for (const day in this.plan) {
					if (this.plan[day] !== undefined) {
						this.plan[day] = this.plan[day].filter(
							(assignment: Assignment): boolean => assignment.id !== assignment_id
						);
					}
				}

				if (target.classList.contains("weekday-assignments")) {
					// The assignment is being moved to the planner.
					// Remove the "no assignments" message if it's in the planner.
					const noAssignments: HTMLElement | null =
						target.querySelector(".no-assignments");
					if (noAssignments !== null) {
						noAssignments.remove();
					}

					// Add the "no assignments" message to the sidebar if required.
					// TODO: We have to check if it has no children that are set to display block as under some
					//  circumstances they are set to display: none instead.
					if (source.children.length === 0) {
						this.addNoAssignmentsMessage(source);
					}

					// Add the assignment to the plan.
					const target_day: string = target.classList[1];
					let target_day_plan: Assignment[] = this.plan[target_day];

					if (target_day_plan === undefined) {
						target_day_plan = [];
					}

					target_day_plan.push(assignment);
					this.plan[target_day] = target_day_plan;

					// Update the assignment info
					assignment.planned = true;
				} else {
					// The assignment is being moved back to the sidebar.
					// The two places it can be dropped to trigger this is the overall sidebar or an individual
					// course's segment in the sidebar.

					// Add the "no assignments" message in the planner if required.
					if (source.children.length === 0) {
						this.addNoAssignmentsMessage(source);
					}

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

					// Remove the "no assignments" message if it's in the sidebar.
					const noAssignments: HTMLElement | null =
						target_course.querySelector(".no-assignments");

					if (noAssignments !== null) {
						noAssignments.remove();
					}

					// Update the assignment info
					assignment.planned = false;
				}

				this.utility.saveStorage("plan", JSON.stringify(this.plan));
				course.saveCourse();
			}
		);
	}

	createAnnouncements(announcement_container: Element): void {
		// Adds the announcements to the container
		// Get list of announcements
		const announcements: Assignment[] = this.courses
			.flatMap((course: Course): Assignment[] => course.assignments)
			.filter((assignment: Assignment): boolean => assignment.type === "announcement");

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
			const course: Course | undefined = this.courses.find((course: Course): boolean => {
				return course.id === announcement.course_id;
			});

			if (course === undefined) {
				this.utility.alerter("Error: Course not found.");
				return;
			}

			const link: string = `/courses/${announcement.course_id}/discussion_topics/${announcement.id}`;
			const announcementJson: HtmlElement = {
				element: "div",
				attributes: { class: "announcement" },
				children: [
					{
						element: "a",
						attributes: {
							href: link,
							target: "_blank",
							title: announcement.name
						},
						textContent: announcement.name
					},
					{
						element: "p",
						attributes: { class: "course" },
						textContent: course.name
					}
				]
			};
			const announcementDiv: HTMLElement = this.utility.createHtmlFromJson(announcementJson);
			announcement_container.appendChild(announcementDiv);
		}
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
		for (let i = 0; i < 7 * this.settings.planDistance; i++) {
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
			// Add locked assignments for that day.
			this.addLockedAssignments(day, dayDiv);

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
			}
			if (dayDiv.children[1].children.length === 0) {
				// The day has no assignments planned.
				const weekdayAssignments: HTMLElement | null =
					dayDiv.querySelector(".weekday-assignments");

				if (weekdayAssignments === null) {
					this.utility.alerter("Error: Weekday assignments not found.");
					return;
				}

				this.addNoAssignmentsMessage(weekdayAssignments);
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

		const showEvents: boolean = this.settings.showEvents;
		const lockedAssignments: Assignment[] = this.courses
			.flatMap((course: Course): Assignment[] => course.assignments)
			.filter((assignment: Assignment): boolean => {
				if (
					// It has to be locked
					assignment.lock &&
					// It can't be a calendar event if we're not showing them.
					(showEvents || assignment.type !== "calendar_event") &&
					// It can't be an announcement.
					assignment.type !== "announcement" &&
					// It has to be due on the day we're looking at.
					this.utility.formatDate(assignment.due_date)[0] ===
						this.utility.formatDate(day)[0]
				) {
					return true;
				}
				return false;
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

	addNoAssignmentsMessage(target: HTMLElement): void {
		// Adds a message telling the user there are no assignments.
		const noAssignmentsElement: HtmlElement = {
			element: "li",
			attributes: { class: "no-assignments" }
			// The content of this message is added with CSS.
		};
		const noAssignments: HTMLElement = this.utility.createHtmlFromJson(noAssignmentsElement);

		target.appendChild(noAssignments);
	}
}
