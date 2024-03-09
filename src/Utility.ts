class Utility {
	alerter(message: string): void {
		console.log(message);
	}

	createHtmlFromJson(data: HtmlElement): HTMLElement {
		const element: HTMLElement = document.createElement(data.element);

		for (const key in data.attributes) {
			element.setAttribute(key, data.attributes[key]);
		}

		if (data.textContent) {
			element.textContent = data.textContent;
		}

		if (data.innerHTML) {
			element.innerHTML = data.innerHTML;
		}

		if (data.children) {
			for (const childData of data.children) {
				const child = this.createHtmlFromJson(childData);
				element.appendChild(child);
			}
		}
		return element;
	}

	async loadStorage(key: string): Promise<string | undefined> {
		const info: { [p: string]: any } = await chrome.storage.sync.get(key);
		return info[key];
	}

	async loadSettings(): Promise<SettingsJson> {
		const settingsJson: string | undefined = await this.loadStorage("settings");
		// Default settings. To be overridden if settings are found in local storage.
		let settings: SettingsJson = {
			prioritizePoorGrades: false,
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
			showEvents: false
		};

		if (settingsJson === undefined) {
			// Default estimateMultiplier
			const courseIds: string | undefined = await this.loadStorage("courseIds");
			if (courseIds !== undefined) {
				// Set default estimate multipliers.
				const ids: string[] = JSON.parse(courseIds);
				for (const id of ids) {
					settings.estimateMultiplier[id] = 1;
				}
			}
		} else {
			settings = JSON.parse(settingsJson);
		}
		return settings;
	}

	async saveStorage(key: string, data: string): Promise<void> {
		const info: { [p: string]: string } = {};
		info[key] = data;
		await chrome.storage.sync.set(info);
	}

	async clearStorage(): Promise<void> {
		await chrome.storage.sync.clear();
	}

	async loadPlan(): Promise<Plan> {
		const plan: string | undefined = await this.loadStorage("plan");
		if (plan === undefined) {
			// Create an empty plan for this week.
			const today: Date = new Date();
			const monday: Date = new Date(today.setDate(today.getDate() - today.getDay() + 1));
			const plan: Plan = {};
			for (let i = 0; i < 5; i++) {
				const day: Date = new Date(monday);
				day.setDate(day.getDate() + i);
				plan[day.toISOString().slice(0, 10)] = [];
			}
			return plan;
		} else {
			const planObject: Plan = JSON.parse(plan);
			// Convert all the dates back to Date objects.
			for (const date in planObject) {
				planObject[date].forEach(assignment => {
					assignment.due_date = new Date(assignment.due_date);
				});
			}
			return planObject;
		}
	}

	getEstimate(assignment: Assignment, estimator: Estimator): string {
		let estimate = "";
		if (assignment.user_estimate !== undefined && assignment.user_estimate !== null) {
			estimate = assignment.user_estimate.toString();
		} else if (
			assignment.history_estimate !== undefined &&
			assignment.history_estimate !== null
		) {
			estimate = assignment.history_estimate.toString();
		} else {
			estimator.estimateTime(assignment);

			if (assignment.basic_estimate === undefined || assignment.basic_estimate === null) {
				this.alerter("Error: No estimator failed to estimate.");
			} else {
				estimate = assignment.basic_estimate.toString();
			}
		}
		return estimate;
	}

	formatDate(date: Date): [string, string] {
		const dayOfWeek: string = date.toLocaleString("en-US", { weekday: "short" });
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
		const hour: number = date.getHours();
		const minute: string = date.getMinutes().toString().padStart(2, "0");
		const meridian: "am" | "pm" = hour < 12 ? "am" : "pm";

		const formattedTime = `${hour % 12}:${minute} ${meridian}`;

		// Combine the date and time parts
		return [formattedDate, formattedTime];
	}

	wait(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	parseLinkHeader(linkHeader: string | null): { [rel: string]: string } {
		if (!linkHeader) {
			return {};
		}

		const links: { [rel: string]: string } = {};
		const parts: string[] = linkHeader.split(",");

		for (const part of parts) {
			const [url, rel] = part.trim().split(";");
			links[rel.split("=")[1].slice(1, -1)] = url.trim().slice(1, -1);
		}

		return links;
	}
}
