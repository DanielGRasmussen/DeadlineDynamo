class Planner {
	// [0] Header buttons are added. [1] Data is done loading.
	conditions: boolean[] = data.loadConditions;
	courses: Course[] = data.courses;

	sidebar: Sidebar = new Sidebar();
	announcements: Announcements | undefined;

	constructor() {
		this.start().then(_ => {});
	}

	async start(): Promise<void> {
		let triggeredHeader: boolean = false;
		let triggeredAnnouncements: boolean = false;
		let triggeredMain: boolean = false;

		for (let i: number = 0; i < 20; i++) {
			await utility.wait(500);

			if (data.courses.length !== 0) {
				this.courses = data.courses;
			}

			if (!triggeredHeader && this.conditions[0]) {
				utility.log("Creating sidebar button.");
				// Check on if our sidebar pullout button is there. It should be.
				const sidebar_button: Element | null = document.querySelector(".dd-sidebar-button");

				if (sidebar_button === null) {
					utility.notify("error", "Sidebar button not found.");
					return;
				}

				// Add the event listener to create the sidebar when the button is clicked.
				sidebar_button.addEventListener("click", () => {
					this.sidebar.createSidebar();
				});

				triggeredHeader = true;
			}
			if (
				!triggeredAnnouncements &&
				this.conditions[0] &&
				this.conditions[1] &&
				this.courses?.length !== 0
			) {
				utility.log("Creating announcements.");

				// Populate the list of announcements.
				this.announcements = new Announcements();

				triggeredAnnouncements = true;

				// Add unplanned/uncompleted count for the sidebar button.
				this.sidebar.addUnplannedCount();
			}

			if (this.conditions[1] && this.courses?.length !== 0 && !triggeredMain) {
				utility.log("Creating planner.");
				// Add the weekday slots.
				this.addWeekdaySlots();

				// Scroll down to current day.
				if (document.body.classList.contains("dd-view")) {
					utility.scrollToToday();
				}

				triggeredMain = true;
			}
		}
	}

	addWeekdaySlots(offset: number = 0): void {
		// Adds the empty weekday slots to the main UI of the planner.
		utility.log("Adding weekday slots.");
		const planner: HTMLElement | null = document.getElementById("dd-planner");

		if (planner === null) {
			utility.notify("error", "Planner not found.");
			return;
		}

		const sibling: ChildNode | null = planner.firstChild;

		// Get the first day of the week.
		const day: Date = utility.getWeekStart(new Date(), offset);

		// Add the slots for each day of the week.
		for (let i: number = 0; i < 7 * g_settings.planDistance; i++) {
			day.setDate(day.getDate() + 1);

			let date: string = utility.formatDate(day, false)[0];
			if (day.getDate() === new Date().getDate()) {
				// If the day is today swap the ...day out for "Today".
				const today: string[] = date.split(",");
				today[0] = "Today";

				date = today.join(",");
			}

			const dayElement: string = `
				<div class="weekday">
					<h3 class="weekday-name">${date}</h3>
					<ul class="weekday-assignments day-${day.toISOString().slice(0, 10)}"></ul>
				</div>
			`;

			const dayDiv: HTMLElement = utility.convertHtml(dayElement);

			if (offset === 0) {
				planner.appendChild(dayDiv);
			} else {
				sibling?.before(dayDiv);
			}
			// Add locked assignments for that day.
			this.addLockedAssignments(day, dayDiv);

			// Add the assignments planned for that day.
			const currentPlan: PlanItem[] | undefined = g_plan[day.toISOString().slice(0, 10)];

			if (currentPlan !== undefined) {
				currentPlan.forEach((planItem: PlanItem): void => {
					const assignment: Assignment | undefined = this.courses!.flatMap(
						(course: Course): Assignment[] => course.assignments
					).find((assignment: Assignment): boolean => assignment.id === planItem.id);

					if (assignment === undefined) {
						utility.notify("error", "Assignment not found.");
						return;
					}

					const assignmentDiv: HTMLElement = assignment.makeElement();

					const weekdayAssignments: HTMLElement | null =
						dayDiv.querySelector(".weekday-assignments");

					if (weekdayAssignments === null) {
						utility.notify("error", "Weekday assignments not found.");
						return;
					}

					weekdayAssignments.appendChild(assignmentDiv);
				});
			}
		}

		// Hide the spinner now that the planner is done loading.
		const spinner: HTMLElement | null = document.querySelector(".dd-spinner");
		if (spinner === null) {
			utility.log("Spinner not found.");
			return;
		}

		spinner.classList.add("hidden");
	}

	addLockedAssignments(day: Date, dayDiv: HTMLElement): void {
		// Adds the locked assignments for the day.
		utility.log("Adding locked assignments.");
		const showEvents: boolean = g_settings.showEvents;
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
				utility.formatDate(assignment.due_date, true)[0] ===
					utility.formatDate(day, true)[0]
			);
		});

		lockedAssignments.forEach((assignment: Assignment): void => {
			const assignmentDiv: HTMLElement = assignment.makeElement();
			assignmentDiv.classList.add("locked");

			const weekdayAssignments: HTMLElement | null =
				dayDiv.querySelector(".weekday-assignments");

			if (weekdayAssignments === null) {
				utility.notify("error", "Weekday assignments not found.");
				return;
			}

			weekdayAssignments.appendChild(assignmentDiv);
		});
	}

	remakePlanner(): void {
		// Remakes the planner.
		utility.log("Remaking planner.");
		const planner: HTMLElement | null = document.getElementById("dd-planner");

		if (planner === null) {
			utility.notify("error", "Planner not found.");
			return;
		}

		// Remove all the weekday slots.
		planner.innerHTML = "";

		// Add the weekday slots.
		this.addWeekdaySlots();
	}
}
