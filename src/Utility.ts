class Utility {
	domParser: DOMParser = new DOMParser();
	location: string = window.location.host.split(".")[0];

	log(message: string): void {
		const logging: boolean = false;
		if (logging) {
			console.log(message);
		}
	}

	async alerter(message: string): Promise<void> {
		let alertContainer: Element | null = document.getElementsByClassName("alert-container")[0];
		if (!alertContainer) {
			alertContainer = this.convertHtml(`<div class="alert-container"></div>`);

			document.querySelector("html")?.appendChild(alertContainer);
		}

		const alert: HTMLElement = this.convertHtml(`
			<div class="message-alert">
				<p>${message}</p>
				<span class="close-alert">
					<svg viewBox="0 0 1920 1920" focusable="false" class="css-1uh2md0-inlineSVG-svgIcon"><g><path d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z"></path></g></svg>
				</span>
			</div>
		`);

		alert
			.querySelector(".close-alert")
			?.addEventListener("click", this.removeAlert.bind(this, alert));

		alertContainer.appendChild(alert);

		await this.wait(10000);
		await this.removeAlert(alert);
	}

	async removeAlert(alert: HTMLElement): Promise<void> {
		alert.classList.add("fade-out");
		await this.wait(500);
		alert.remove();
	}

	convertHtml(data: string): HTMLElement {
		const element: Document = this.domParser.parseFromString(data, "text/html");
		return element.body.firstChild as HTMLElement;
	}

	async loadStorage(key: string): Promise<string | undefined> {
		const name: string = `${this.location}-${key}`;
		this.log(`Loading ${name} from storage.`);
		const info: { [p: string]: string } = await chrome.storage.sync.get(name);
		return info[name];
	}

	async loadSettings(): Promise<SettingsJson> {
		this.log("Loading settings from storage.");
		const settingsJson: string | undefined = await this.loadStorage("settings");
		// Default settings. To be overridden if settings are found in storage.
		let settings: SettingsJson = {
			useBasicEstimate: true,
			useHistoryEstimate: true,
			workHours: {
				monday: 6,
				tuesday: 6,
				wednesday: 6,
				thursday: 6,
				friday: 6,
				saturday: 6,
				sunday: 0
			},
			estimateMultiplier: {},
			planDistance: 1,
			showEvents: true
		};

		if (settingsJson === undefined) {
			// Default estimateMultiplier
			this.log("No settings found. Using default settings.");

			const courseIds: string | undefined = await this.loadStorage("courseIds");
			if (courseIds !== undefined) {
				// Set default estimate multipliers.
				const ids: string[] = JSON.parse(courseIds);
				for (const id of ids) {
					settings.estimateMultiplier[id] = 1;
				}
			}
		} else {
			this.log("Settings found.");
			settings = JSON.parse(settingsJson);
		}

		this.log(JSON.stringify(settings));
		return settings;
	}

	async saveStorage(key: string, data: string): Promise<void> {
		const name: string = `${this.location}-${key}`;
		this.log(`Saving ${name} to storage.`);
		try {
			const info: { [p: string]: string } = {};
			info[name] = data;
			await chrome.storage.sync.set(info);
		} catch (error) {
			// This likely happened because of too much data trying to be saved.
			console.log(key);
			console.log(data);
		}
	}

	async clearStorage(): Promise<void> {
		this.log("Clearing storage.");
		await chrome.storage.sync.clear();
	}

	async loadPlan(): Promise<Plan> {
		this.log("Loading plan from storage.");
		const plan: string | undefined = await this.loadStorage("plan");
		if (plan === undefined) {
			// Create an empty plan for this week.
			const monday: Date = this.getMonday(new Date());
			const plan: Plan = {};
			for (let i: number = 0; i < 5; i++) {
				const day: Date = new Date(monday);
				day.setDate(day.getDate() + i);
				plan[day.toISOString().slice(0, 10)] = [];
			}
			return plan;
		} else {
			const planObject: Plan = JSON.parse(plan);
			// Convert all the dates back to Date objects.
			for (const date in planObject) {
				planObject[date].forEach(planItem => {
					planItem.due_date = new Date(planItem.due_date);
				});
			}

			return planObject;
		}
	}

	scrollToToday(): void {
		this.log("Scrolling to today.");
		const date: string = new Date().toISOString().slice(0, 10);

		const today: Element | null = document.getElementsByClassName(date)[0];

		if (today === null) {
			this.alerter("Error: Today not found.");
			return;
		}

		// Get the top of the element.
		const elementRect: DOMRect = today.parentElement!.getBoundingClientRect();

		const desiredY: number = elementRect.top + window.scrollY - 80;

		window.scrollTo({ top: desiredY, behavior: "smooth" });
	}

	getEstimate(
		course: Course,
		assignment: Assignment,
		estimator: Estimator,
		settings: Settings | SettingsJson
	): string {
		this.log("Getting estimate.");
		if (assignment.user_estimate !== null) {
			// If there is a user estimate, use that.
			this.log("User estimate found.");
			return assignment.user_estimate.toString();
		} else if (settings.useHistoryEstimate && assignment.history_estimate !== null) {
			// If there is a history estimate, use that.
			this.log("History estimate found.");
			return assignment.history_estimate.toString();
		} else if (settings.useHistoryEstimate) {
			// Otherwise try to make a history based estimate.
			estimator.historyEstimate(course, assignment);

			if (assignment.history_estimate !== null) {
				this.log("History estimate made.");
				return assignment.history_estimate.toString();
			}
		}
		// If a history based estimate can't be made, use the basic estimate.
		estimator.estimateTime(assignment);

		if (assignment.basic_estimate === null) {
			this.alerter("Error: No estimator failed to estimate.");
			return "";
		} else if (!settings.useBasicEstimate) {
			this.log("Basic estimate not used.");
			return "";
		} else {
			this.log("Basic estimate used.");
			return assignment.basic_estimate.toString();
		}
	}

	createPlan(plan: Plan, courses: Course[], estimator: Estimator, settings: SettingsJson): Plan {
		// Create a list of all assignments sorted by priority.
		this.log("Creating plan.");
		const allAssignments: Assignment[] = [];

		for (const course of courses) {
			for (const assignment of course.assignments) {
				// Filter out assignments that shouldn't be automatically planned.
				if (
					!assignment.planned &&
					!assignment.lock &&
					!assignment.submitted &&
					assignment.type !== "announcement"
				) {
					assignment.priority = estimator.getPriority(assignment);
					allAssignments.push(assignment);
				}
			}
		}

		allAssignments.sort((a, b) => b.priority - a.priority);

		// Plan the assignments.
		for (const day of Object.keys(plan)) {
			const date: Date = new Date(day);
			const workHours: number =
				settings.workHours[date.toLocaleString("en-US", { weekday: "long" }).toLowerCase()];

			// Plan the assignments for this day.
			let timeRemaining: number = workHours * 60;
			for (const assignment of allAssignments) {
				// Skip the assignment if it is planned.
				if (assignment.planned) {
					continue;
				}

				const estimate: number = parseInt(
					this.getEstimate(courses[assignment.course_id], assignment, estimator, settings)
				);

				// If the assignment can be planned without running over the limit, plan it.
				if (timeRemaining - estimate >= 0) {
					const plannedAssignment: PlanItem = {
						id: assignment.id,
						due_date: assignment.due_date
					};
					plan[day].push(plannedAssignment);
					assignment.planned = true;
					timeRemaining -= estimate;
				}
			}
		}

		// Save the courses.
		for (const course of courses) {
			course.saveCourse();
		}

		// If there are leftover assignments let the user know.
		const leftoverAssignments: Assignment[] = allAssignments.filter(
			assignment => !assignment.planned && !assignment.lock && !assignment.submitted
		);

		if (leftoverAssignments.length > 0) {
			this.alerter(
				`There are ${leftoverAssignments.length} assignments that could not be planned.`
			);
		}

		return plan;
	}

	getMonday(date: Date, offset: number = 0): Date {
		const monday: Date = new Date(date);
		monday.setDate(monday.getDate() - monday.getDay() + 1 + offset * 7);
		return monday;
	}

	daysUntil(date: Date): number {
		// Gets days between the monday and the date.
		const monday: Date = this.getMonday(new Date());
		const difference: number = date.getTime() - monday.getTime();
		return Math.ceil(difference / (1000 * 60 * 60 * 24));
	}

	formatDate(date: Date, shortDay: boolean): [string, string] {
		let dayOfWeek: string;
		if (shortDay) {
			dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });
		} else {
			dayOfWeek = date.toLocaleString("en-US", { weekday: "long" });
		}

		const month: string = date.toLocaleString("en-US", { month: "short" });
		const day: number = date.getDate();
		// Got this from the internet. Just assigns the correct ordinal to the day.
		const ordinal: "th" | "st" | "nd" | "rd" =
			day === 11 || day === 12 || day === 13
				? "th"
				: day % 10 === 1
					? "st"
					: day % 10 === 2
						? "nd"
						: day % 10 === 3
							? "rd"
							: "th";

		const formattedDate: string = `${dayOfWeek}, ${month} ${day}${ordinal}`;

		// Format the time part
		let hour: number = date.getHours();
		const minute: string = date.getMinutes().toString().padStart(2, "0");
		const meridian: "am" | "pm" = hour < 12 ? "am" : "pm";

		// So noon is 12pm.
		hour %= 12;
		if (hour === 0) {
			hour = 12;
		}

		const formattedTime: string = `${hour}:${minute} ${meridian}`;

		// Combine the date and time parts
		return [formattedDate, formattedTime];
	}

	wait(ms: number): Promise<void> {
		this.log(`Waiting for ${ms}ms.`);
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	parseLinkHeader(linkHeader: string | null): { [rel: string]: string } {
		if (!linkHeader) {
			return {};
		}
		this.log("Parsing link header.");

		const links: { [rel: string]: string } = {};
		const parts: string[] = linkHeader.split(",");

		for (const part of parts) {
			const [url, rel] = part.trim().split(";");
			links[rel.split("=")[1].slice(1, -1)] = url.trim().slice(1, -1);
		}

		return links;
	}
}
