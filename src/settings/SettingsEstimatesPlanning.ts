class SettingsEstimatesPlanning extends SettingsPage {
	getName(): string {
		return "Estimates & Planning";
	}

	async createSettingsPage(): Promise<void> {
		// Creates the settings page.
		this.utility.log("Creating the estimates & planning settings.");
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
			},
			children: [
				{
					element: "h1",
					textContent: "Estimation & Planning Settings"
				},
				{
					element: "div",
					attributes: {
						class: "settings"
					}
				}
			]
		};
		const container: HTMLElement = this.utility.createHtmlFromJson(containerJson);
		const settings: Element = container.querySelector(".settings")!;

		// Use estimates
		const useEstimatesJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "use-estimates"
			},
			children: [
				{
					element: "div",
					attributes: {
						class: "useBasicEstimateContainer"
					},
					children: [
						{
							element: "label",
							attributes: {
								for: "useBasicEstimate"
							},
							textContent: "Use basic estimate: "
						},
						{
							element: "input",
							attributes: {
								type: "checkbox",
								id: "useBasicEstimate",
								class: "useBasicEstimate"
							}
						}
					]
				},
				{
					element: "div",
					attributes: {
						class: "useHistoryEstimateContainer"
					},
					children: [
						{
							element: "label",
							attributes: {
								for: "useHistoryEstimate"
							},
							textContent: "Use history estimate: "
						},
						{
							element: "input",
							attributes: {
								type: "checkbox",
								id: "useHistoryEstimate",
								class: "useHistoryEstimate"
							}
						}
					]
				}
			]
		};

		const useEstimates: HTMLElement = this.utility.createHtmlFromJson(useEstimatesJson);

		settings.appendChild(useEstimates);

		if (this.useBasicEstimate) {
			(useEstimates.querySelector("#useBasicEstimate") as HTMLInputElement).checked = true;
		}
		if (this.useHistoryEstimate) {
			(useEstimates.querySelector("#useHistoryEstimate") as HTMLInputElement).checked = true;
		}

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

		settings.appendChild(workHours);

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

		settings.appendChild(estimateMultiplier);

		// Buttons
		const buttons: HTMLElement = this.getButtons();

		container.appendChild(buttons);

		// Add the container to the page.
		target.appendChild(container);
	}

	getSettings(): void {
		// Gets settings from the page and updates the class properties.
		this.utility.log("Getting settings.");
		// Use estimates
		this.useBasicEstimate = (
			document.getElementById("useBasicEstimate") as HTMLInputElement
		).checked;
		this.useHistoryEstimate = (
			document.getElementById("useHistoryEstimate") as HTMLInputElement
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

		this.utility.log(`Settings: ${JSON.stringify(this)}`);
	}

	restoreSettings(): void {
		// Restores the settings to their previous state if the user presses the cancel button.
		this.utility.log("Restoring settings.");
		// Use estimates
		(document.getElementById("useBasicEstimate") as HTMLInputElement).checked =
			this.useBasicEstimate;
		(document.getElementById("useHistoryEstimate") as HTMLInputElement).checked =
			this.useHistoryEstimate;

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
}
