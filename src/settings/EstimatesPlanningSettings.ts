class EstimatesPlanningSettings extends BaseSettings {
	getName(): string {
		return "Estimates & Planning";
	}

	getClass(): string {
		return "estimates-planning";
	}

	async createSettingsPage(): Promise<void> {
		// Creates the settings page.
		utility.log("Creating the estimates & planning settings.");
		const target: Element | null = document.querySelector("div.settings-wrapper");
		if (target === null) {
			utility.notify("error", "Couldn't find the content wrapper.");
			return;
		}

		// Container for the list of items
		const containerData: string = `
			<div class="settings-container">
				<h1>Estimation & Planning Settings</h1>
				<div class="settings"></div>
			</div>
		`;

		const container: HTMLElement = utility.convertHtml(containerData);
		const settings: Element = container.querySelector(".settings")!;

		// Use estimates
		const useEstimatesData: string = `
			<div class="use-estimates">
				<div class="useBasicEstimateContainer">
					<label for="useBasicEstimate">Use basic estimate: </label>
					<input type="checkbox" id="useBasicEstimate" class="useBasicEstimate">
				</div>
				<div class="useHistoryEstimateContainer">
					<label for="useHistoryEstimate">Use history estimate: </label>
					<input type="checkbox" id="useHistoryEstimate" class="useHistoryEstimate">
				</div>
			</div>
		`;

		const useEstimates: HTMLElement = utility.convertHtml(useEstimatesData);

		settings.appendChild(useEstimates);

		if (this.useBasicEstimate) {
			(useEstimates.querySelector("#useBasicEstimate") as HTMLInputElement).checked = true;
		}
		if (this.useHistoryEstimate) {
			(useEstimates.querySelector("#useHistoryEstimate") as HTMLInputElement).checked = true;
		}

		// Work hours section
		const workHoursData: string = `
			<div class="work-hours">
				<h2>Work Hours</h2>
			</div>
		`;

		const workHours: HTMLElement = utility.convertHtml(workHoursData);

		for (const day in this.workHours) {
			const workHoursDayData: string = `
				<p>
					<label for="${day}">${day.charAt(0).toUpperCase() + day.slice(1)}</label>
					<input type="number" id="${day}" value="${this.workHours[day]}" max="24" min="0">
				</p>
			`;

			const workHoursDay: HTMLElement = utility.convertHtml(workHoursDayData);
			workHours.appendChild(workHoursDay);
		}

		settings.appendChild(workHours);

		// Estimate multiplier section
		const estimateMultiplierData: string = `
			<div class="estimate-multiplier">
				<h2>Estimate Multipliers</h2>
			</div>
		`;

		const estimateMultiplier: HTMLElement = utility.convertHtml(estimateMultiplierData);

		for (const courseId in this.estimateMultiplier) {
			// Get course name
			const courseInfo: string | undefined = await utility.loadStorage(courseId);
			if (courseInfo === undefined) {
				utility.notify("error", "Couldn't find course info.");
				return;
			}

			const course: LocalCourseJson = JSON.parse(courseInfo);
			const courseName: string = course.name;

			// Make the course multiplier element
			const estimateMultiplierCourseData: string = `
				<p>
					<label for="${courseId}">${courseName}</label>
					<input type="number" id="${courseId}" value="${this.estimateMultiplier[courseId]}" max="100" min="0">
				</p>
			`;

			const estimateMultiplierCourse: HTMLElement = utility.convertHtml(
				estimateMultiplierCourseData
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
		utility.log("Getting settings.");
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

		utility.log(`Settings: ${JSON.stringify(this)}`);
	}

	restoreSettings(): void {
		// Restores the settings to their previous state if the user presses the cancel button.
		utility.log("Restoring settings.");
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
