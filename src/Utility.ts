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

	async loadStorage(key: string): Promise<string | null> {
		return await localStorage.getItem(key);
	}

	async loadSettings(): Promise<SettingsJson> {
		const settingsJson: string | null = await this.loadStorage("settings");
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
			planDistance: 2
		};

		if (settingsJson === null) {
			// Default estimateMultiplier
			const courseIds: string | null = await this.loadStorage("courseIds");
			if (courseIds !== null) {
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
		localStorage.setItem(key, data);
	}

	loadPlan(): Plan {
		const plan: string | null = localStorage.getItem("plan");
		if (plan === null) {
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
			return JSON.parse(plan);
		}
	}

	getEstimate(assignment: Assignment, estimator: Estimator): string {
		let estimate = "";
		if (assignment.userEstimate !== undefined && assignment.userEstimate !== null) {
			estimate = assignment.userEstimate.toString();
		} else if (
			assignment.historyEstimate !== undefined &&
			assignment.historyEstimate !== null
		) {
			estimate = assignment.historyEstimate.toString();
		} else {
			estimator.estimateTime(assignment);

			if (assignment.basicEstimate === undefined || assignment.basicEstimate === null) {
				this.alerter("Error: No estimator failed to estimate.");
			} else {
				estimate = assignment.basicEstimate.toString();
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
}
