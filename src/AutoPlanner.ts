class AutoPlanner {
	createPlan(): Plan {
		// Create a list of all assignments sorted by priority.
		utility.log("Creating plan.");
		let allAssignments: Assignment[] = data.courses.flatMap(course => course.assignments);

		const lockedAssignments: Assignment[] = [];
		for (const assignment of allAssignments) {
			if (assignment.lock) {
				// && !assignment.submitted) {
				lockedAssignments.push(assignment);
			}
		}

		allAssignments = allAssignments.filter(
			assignment =>
				!assignment.submitted && !assignment.lock && assignment.type !== "announcement"
		);

		allAssignments = allAssignments.sort((a, b) => b.priority - a.priority);
		for (const assignment of allAssignments) {
			assignment.planned = false;
		}

		// Plan the assignments.
		for (
			const day: Date = new Date(data.startDate);
			day <= data.endDate;
			day.setDate(day.getDate() + 1)
		) {
			const formattedDate: string = day.toISOString().slice(0, 10);
			g_plan[formattedDate] = [];
			const today: PlanItem[] = g_plan[formattedDate];

			const dayOfWeek: string = day
				.toLocaleString("en-US", { weekday: "long" })
				.toLowerCase();

			const workHours: number = g_settings.workHours[dayOfWeek];

			// Plan the assignments for this day.
			let timeRemaining: number = workHours * 60;

			// Subtract time used by locked assignments.
			for (const assignment of lockedAssignments) {
				const dueDate: Date = new Date(assignment.due_date);
				dueDate.setHours(0, 0, 0, 0);
				const dueDateString: string = dueDate.toISOString().slice(0, 10);

				if (dueDateString === formattedDate) {
					const estimate: number = parseInt(
						data.estimator.getEstimate(assignment, data.courses[assignment.course_id])
					);

					if (!isNaN(estimate)) {
						timeRemaining -= estimate;
					}
				}
			}

			for (const assignment of allAssignments) {
				if (assignment.planned) {
					// We already planned this one.
					continue;
				}

				const estimate: number = parseInt(
					data.estimator.getEstimate(assignment, data.courses[assignment.course_id])
				);

				if (isNaN(estimate)) {
					continue;
				}

				// If the assignment can be planned without running over the limit, plan it.
				if (timeRemaining - estimate >= 0) {
					const plannedAssignment: PlanItem = {
						id: assignment.id,
						due_date: assignment.due_date
					};
					today.push(plannedAssignment);
					assignment.planned = true;
					timeRemaining -= estimate;
				} else {
					assignment.planned = false;
				}
			}
		}

		// Save the courses.
		for (const course of data.courses) {
			course.saveCourse();
		}

		// Save the plan.
		utility.saveStorage("plan", JSON.stringify(g_plan));

		// If there are leftover assignments let the user know.
		const leftoverAssignments: Assignment[] = allAssignments.filter(
			assignment => !assignment.planned && !assignment.lock && !assignment.submitted
		);

		if (leftoverAssignments.length > 0) {
			utility.notify(
				"info",
				`There are ${leftoverAssignments.length} assignments that could not be planned.`
			);
		}

		return g_plan;
	}

	displayNewPlan(): void {
		data.planner!.remakePlanner();

		data.planner!.sidebar.deleteSidebar();
		data.planner!.sidebar.updateUnplannedCount();
	}
}
