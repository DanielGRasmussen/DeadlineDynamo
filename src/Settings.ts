class Settings {
	utility: Utility = new Utility();
	link: string = "/deadline-dynamo";
	prioritizePoorGrades!: boolean;
	workHours!: WorkHours;
	estimateMultiplier!: EstimateMultiplier;
	planDistance!: number;
	showEvents!: boolean;

	constructor() {
		// Load settings from local storage.
		this.utility.loadSettings().then(settings => {
			this.prioritizePoorGrades = settings.prioritizePoorGrades;
			this.workHours = settings.workHours;
			this.estimateMultiplier = settings.estimateMultiplier;
			this.planDistance = settings.planDistance;
			this.showEvents = settings.showEvents;
			this.createSettingsPage();
		});
	}

	async createSettingsPage(): Promise<void> {
		// Creates the settings page.
		const target: Element | null = document.querySelector("div.settings-wrapper");
		if (target === null) {
			this.utility.alerter("Error: Couldn't find the content wrapper.");
			return;
		}

		// Container for the list of items
		const containerJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "settings-container"
			}
		};
		const container: HTMLElement = this.utility.createHtmlFromJson(containerJson);

		// Work hours section
		const workHoursJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "work-hours"
			},
			children: [
				{
					element: "h2",
					textContent: "Work Hours"
				}
			]
		};
		const workHours: HTMLElement = this.utility.createHtmlFromJson(workHoursJson);

		for (const day in this.workHours) {
			const workHoursDayJson: HtmlElement = {
				element: "p",
				children: [
					{
						element: "label",
						attributes: {
							for: day
						},
						textContent: day.charAt(0).toUpperCase() + day.slice(1)
					},
					{
						element: "input",
						attributes: {
							type: "number",
							id: day,
							value: this.workHours[day].toString(),
							max: "24",
							min: "0"
						}
					}
				]
			};

			const workHoursDay: HTMLElement = this.utility.createHtmlFromJson(workHoursDayJson);
			workHours.appendChild(workHoursDay);
		}

		container.appendChild(workHours);

		// Estimate multiplier section
		const estimateMultiplierJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "estimate-multiplier"
			},
			children: [
				{
					element: "h2",
					textContent: "Estimate Multipliers"
				}
			]
		};
		const estimateMultiplier: HTMLElement =
			this.utility.createHtmlFromJson(estimateMultiplierJson);

		for (const courseId in this.estimateMultiplier) {
			// Get course name
			const courseInfo: string | undefined = await this.utility.loadStorage(courseId);
			if (courseInfo === undefined) {
				this.utility.alerter("Error: Couldn't find course info.");
				return;
			}

			const course: LocalCourseJson = JSON.parse(courseInfo);
			const courseName: string = course.name;

			// Make the course multiplier element
			const estimateMultiplierCourseJson: HtmlElement = {
				element: "p",
				children: [
					{
						element: "label",
						attributes: {
							for: courseId
						},
						textContent: courseName
					},
					{
						element: "input",
						attributes: {
							type: "number",
							id: courseId,
							value: this.estimateMultiplier[courseId].toString(),
							max: "100",
							min: "0"
						}
					}
				]
			};

			const estimateMultiplierCourse: HTMLElement = this.utility.createHtmlFromJson(
				estimateMultiplierCourseJson
			);
			estimateMultiplier.appendChild(estimateMultiplierCourse);
		}

		container.appendChild(estimateMultiplier);

		// Add the container to the page.
		target.appendChild(container);

		// Prioritize poor grades checkbox
		const prioritizePoorGradesJson: HtmlElement = {
			element: "p",
			attributes: {
				class: "prioritize-poor-grades"
			},
			children: [
				{
					element: "input",
					attributes: {
						type: "checkbox",
						id: "prioritizePoorGrades"
					}
				},
				{
					element: "label",
					attributes: {
						for: "prioritizePoorGrades"
					},
					textContent: "Prioritize Classes With Poor Grades"
				}
			]
		};

		const prioritizePoorGrades: HTMLElement =
			this.utility.createHtmlFromJson(prioritizePoorGradesJson);
		target.appendChild(prioritizePoorGrades);

		// Clear storage button
		const clearStorageJson: HtmlElement = {
			element: "button",
			attributes: {
				id: "clearStorage",
				class: "btn btn-danger"
			},
			textContent: "Clear Storage"
		};
		const clearStorage: HTMLElement = this.utility.createHtmlFromJson(clearStorageJson);
		clearStorage.addEventListener("click", (): void => {
			if (confirm("Are you sure you want to clear all data?")) {
				this.utility.clearStorage();
				this.utility.alerter("Storage cleared!");
			}
		});
		target.appendChild(clearStorage);

		// Set state to match the saved state.
		(document.getElementById("prioritizePoorGrades") as HTMLInputElement).checked =
			this.prioritizePoorGrades;

		// Buttons
		const buttonsJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "button-container"
			},
			children: [
				{
					element: "button",
					attributes: {
						id: "cancelButton",
						class: "btn cancel_button"
					},
					textContent: "Cancel"
				},
				{
					element: "button",
					attributes: {
						id: "saveButton",
						class: "btn btn-primary"
					},
					textContent: "Update Settings"
				}
			]
		};
		const buttons: HTMLElement = this.utility.createHtmlFromJson(buttonsJson);

		// Add event listeners to the buttons
		const cancelButton: Node = buttons.firstChild as Node;
		const saveButton: Node = buttons.lastChild as Node;

		cancelButton.addEventListener("click", (): void => {
			this.restoreSettings.bind(this)();
		});
		saveButton.addEventListener("click", (): void => {
			this.getSettings.bind(this)();
			this.saveSettings.bind(this)();
		});

		target.appendChild(buttons);
	}

	getSettings(): void {
		// Gets settings from the page and updates the class properties.
		// Prioritize poor grades
		this.prioritizePoorGrades = (
			document.querySelector("#prioritizePoorGrades") as HTMLInputElement
		).checked;

		// Work hours
		for (const day in this.workHours) {
			this.workHours[day] = parseInt(
				(document.querySelector(`#${day}`) as HTMLInputElement).value
			);
			if (this.workHours[day] < 0) {
				this.workHours[day] = 0;
			}
		}

		// Estimate multipliers
		for (const courseId in this.estimateMultiplier) {
			this.estimateMultiplier[courseId] = parseFloat(
				(document.querySelector(`#${courseId}`) as HTMLInputElement).value
			);
		}
	}

	restoreSettings(): void {
		// Restores the settings to their previous state if the user presses the cancel button.
		// Prioritize poor grades
		(document.getElementById("prioritizePoorGrades") as HTMLInputElement).checked =
			this.prioritizePoorGrades;

		// Work hours
		for (const day in this.workHours) {
			(document.getElementById(day) as HTMLInputElement).value =
				this.workHours[day].toString();
		}

		// Estimate multipliers
		for (const courseId in this.estimateMultiplier) {
			(document.getElementById(courseId) as HTMLInputElement).value =
				this.estimateMultiplier[courseId].toString();
		}
	}

	async saveSettings(): Promise<void> {
		// Stringifies and saves the settings to local storage.
		const settings: string = JSON.stringify({
			prioritizePoorGrades: this.prioritizePoorGrades,
			workHours: this.workHours,
			estimateMultiplier: this.estimateMultiplier,
			planDistance: this.planDistance,
			showEvents: this.showEvents
		});
		await this.utility.saveStorage("settings", settings);

		this.utility.alerter("Settings saved!");
	}
}

new Settings();
