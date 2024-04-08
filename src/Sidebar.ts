class Sidebar {
	utility: Utility = data.utility;
	estimator: Estimator = data.estimator;
	courses: Course[] = data.courses;
	settings: SettingsJson = data.settings;
	plan: Plan = data.plan;
	addedDragula: boolean = false;
	drake: Drake | undefined;

	createSidebar(): void {
		// Check if the sidebar is already open.
		this.utility.log("Creating sidebar.");
		const planner: HTMLElement | null = document.getElementById("dd-planner");

		if (planner === null) {
			this.utility.notify("error", "Planner not found.");
			return;
		}

		if (planner.classList.contains("sidebar-open")) {
			return;
		}

		const sidebarHTML: string = `
			<span class="dd-sidebar">
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

		const sidebar: HTMLElement = this.utility.convertHtml(sidebarHTML);

		// This is the element that the default pullout sidebars are placed by, so we will do the same.
		const sidebarSibling: HTMLElement | null = document.getElementById("nav-tray-portal");

		if (sidebarSibling === null) {
			this.utility.notify("error", "Sidebar sibling not found.");
			return;
		}

		sidebarSibling.after(sidebar);

		// Set up the close button.
		const closeButton: HTMLElement | null = document.querySelector(".sidebar-close");

		if (closeButton === null) {
			this.utility.notify("error", "Sidebar close button not found.");
			return;
		}

		closeButton.addEventListener("click", this.deleteSidebar.bind(this));

		// Set up the plan button.
		const planButton: HTMLElement | null = document.querySelector(".plan");

		if (planButton === null) {
			this.utility.notify("error", "Plan button not found.");
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

		this.addCoursesToSidebar();

		// Dragula is now useful since the sidebar (where assignments are dragged to/from) is now created.
		this.addDragula();

		// Add the "sidebar-open" class so stuff is draggable.
		planner.classList.add("sidebar-open");
	}

	addDragula(): void {
		if (this.addedDragula) {
			const containers: NodeListOf<HTMLElement> = document.querySelectorAll(
				".weekday-assignments, .course-assignments, .sidebar-courses"
			);
			// Add containers to drake.
			this.drake!.containers = Array.from(containers);
			return;
		}
		this.addedDragula = true;

		const assignment_containers: NodeListOf<HTMLElement> = document.querySelectorAll(
			".weekday-assignments, .course-assignments, .sidebar-courses"
		);
		const containers: HTMLElement[] = Array.from(assignment_containers);

		this.utility.log("Adding dragula.");

		// @ts-expect-error - Dragula is defined in the dragula package.
		this.drake = dragula(containers, {
			revertOnSpill: true,
			invalid: (el: HTMLElement, _: never) => {
				const planner: HTMLElement | null = document.getElementById("dd-planner");

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

		this.drake.on("drop", this.dragulaDrop.bind(this));
	}

	dragulaDrop(el: Element, target: Element, _: Element, __: Element): void {
		// Gets course and assignment id to allow us to find the assignment.
		// They have identifiers of "cid-#" and "aid-#" respectively.
		const course_id: number = parseInt(el.classList[1].substring(4));
		const assignment_id: number = parseInt(el.classList[2].substring(4));

		// Find the course.
		const course: Course | undefined = this.courses!.find(
			(course: Course): boolean => course.id === course_id
		);

		if (course === undefined) {
			this.utility.notify("error", "Course not found.");
			return;
		}

		// Find the assignment.
		const assignment: Assignment | undefined = course.assignments.find(
			(assignment: Assignment): boolean => assignment.id === assignment_id
		);

		if (assignment === undefined) {
			this.utility.notify("error", "Assignment not found.");
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
				this.utility.notify(
					"warning",
					`${assignment.name} is being planned for after it's due date.`
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
				this.utility.notify("error", "Target course not found.");
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
		// Update the unplanned/uncompleted count.
		this.updateUnplannedCount();

		this.utility.saveStorage("plan", JSON.stringify(this.plan));
		course.saveCourse();
	}

	deleteSidebar(): void {
		// Deletes the sidebar for when the X button is pressed.
		this.utility.log("Deleting sidebar.");
		const sidebar: HTMLElement | null = document.querySelector(".dd-sidebar");

		if (sidebar === null) {
			this.utility.notify("error", "Sidebar not found.");
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
		const planner: HTMLElement | null = document.getElementById("dd-planner");

		if (planner === null) {
			this.utility.notify("error", "Planner not found.");
			return;
		}

		planner.classList.remove("sidebar-open");
	}

	addCoursesToSidebar(): void {
		// Parent container of all assignments added by this.createSidebar.
		const sidebarCourses: HTMLElement | null = document.querySelector(".sidebar-courses");

		if (sidebarCourses === null) {
			this.utility.notify("error", "Sidebar courses not found.");
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

			const courseDiv: HTMLElement = this.utility.convertHtml(courseElement);

			// Make the course name clickable to collapse the course.
			const courseName: HTMLElement | null = courseDiv.querySelector(".course-name");

			if (courseName === null) {
				this.utility.notify("error", "Course name not found.");
				return;
			}

			courseName.addEventListener("click", (mouseEvent: MouseEvent): void => {
				if (
					!mouseEvent.target ||
					!(mouseEvent.target instanceof HTMLElement) ||
					!mouseEvent.target.parentElement
				) {
					this.utility.notify("error", "Can't add hook to collapse course list.");
					return;
				}
				mouseEvent.target.parentElement.classList.toggle("collapsed");
			});

			sidebarCourses.appendChild(courseDiv);

			this.addAssignmentsToSidebar(course, courseDiv.querySelector(".course-assignments")!);
		}
	}

	async addAssignmentsToSidebar(
		course: Course,
		assignmentContainer: HTMLElement,
		assignments: Assignment[] = course.assignments
	): Promise<void> {
		this.utility.log("Adding assignments to sidebar.");
		if (!this.courses) {
			this.utility.notify("error", "Courses not found.");
			return;
		}

		for (const assignment of assignments) {
			// Make sure it is valid to be planned.
			if (!this.checkPlannable(assignment)) {
				continue;
			}

			assignmentContainer.appendChild(assignment.makeElement(course));
		}
	}

	checkPlannable(assignment: Assignment): boolean {
		// Returns true if the assignment should be plannable.

		return (
			// Already planned assignments don't need to be planned.
			!(
				assignment.planned ||
				// Locked assignments are moved into the planner elsewhere.
				assignment.lock ||
				// Announcements aren't in the base planner.
				assignment.type === "announcement"
			) &&
			// Check if it's in the planning period.
			assignment.due_date >= data.startDate &&
			assignment.due_date <= data.endDate
		);
	}

	updateUnplannedCount(): void {
		const unplannedElement: HTMLElement | null = document.querySelector(
			".dd-sidebar-button .count"
		);

		if (unplannedElement !== null) {
			unplannedElement.remove();
		}

		this.addUnplannedCount();
	}

	addUnplannedCount(): void {
		// Adds the count of unplanned/uncompleted assignments to the sidebar button.
		this.utility.log("Adding unplanned count.");
		const sidebarButton: HTMLElement | null = document.querySelector(".dd-sidebar-button");

		if (sidebarButton === null) {
			this.utility.notify("error", "Sidebar button not found.");
			return;
		}

		const unplannedCount: number = this.courses!.flatMap(
			(course: Course): Assignment[] => course.assignments
		).filter((assignment: Assignment): boolean => {
			return (
				!assignment.planned &&
				!assignment.submitted &&
				!assignment.lock &&
				assignment.type !== "announcement" &&
				// Check if it's in the planning period
				assignment.due_date >= data.startDate &&
				assignment.due_date <= data.endDate
			);
		}).length;

		if (unplannedCount === 0) {
			return;
		}

		let unplannedText: string = unplannedCount.toString();
		if (unplannedCount > 9) {
			// If it is greater than 9, just display 9+.
			unplannedText = "9+";
		}

		const countElement: HTMLElement = this.utility.convertHtml(`
			<p class="count">${unplannedText}</p>
		`);

		sidebarButton.appendChild(countElement);
	}
}
