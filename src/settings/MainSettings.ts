class MainSettings extends BaseSettings {
	getName(): string {
		return "Main";
	}

	async createSettingsPage(): Promise<void> {
		// Creates the settings page.
		this.utility.log("Creating the main settings.");
		const target: Element | null = document.querySelector("div.settings-wrapper");
		if (target === null) {
			this.utility.notify("error", "Couldn't find the content wrapper.");
			return;
		}

		// Container for the list of items
		const containerData: string = `
			<div class="settings-container">
				<h1>Main Settings</h1>
				<div class="settings"></div>
			</div>
		`;

		const container: HTMLElement = this.utility.convertHtml(containerData);
		const settings: Element = container.querySelector(".settings")!;

		// Show events
		const showEventsData: string = `
			<div class="show-events">
				<label for="showEvents">Show events: </label>
				<input type="checkbox" id="showEvents">
			</div>
		`;

		const showEvents: HTMLElement = this.utility.convertHtml(showEventsData);

		settings.appendChild(showEvents);

		// Load the current value from storage
		if (this.showEvents) {
			(showEvents.querySelector("#showEvents") as HTMLInputElement).checked = true;
		}

		// Planned weeks
		const plannedWeeksData: string = `
			<div class="planned-weeks">
				<label for="plannedWeeks">Planned weeks: </label>
				<input type="number" id="plannedWeeks" class="planned-weeks" min="1" max="8" value="${this.planDistance}">
			</div>
		`;

		const plannedWeeks: HTMLElement = this.utility.convertHtml(plannedWeeksData);

		settings.appendChild(plannedWeeks);

		// Week start day
		const weekStartData: string = `
			<div class="week-start-day">
				<label for="weekStart">Week start day: </label>
				<select id="weekStart">
					<option value="0">Sunday</option>
					<option value="1">Monday</option>
					<option value="2">Tuesday</option>
					<option value="3">Wednesday</option>
					<option value="4">Thursday</option>
					<option value="5">Friday</option>
					<option value="6">Saturday</option>
				</select>
			</div>
		`;

		const weekStart: HTMLElement = this.utility.convertHtml(weekStartData);

		// Set the current value
		(weekStart.querySelector("#weekStart") as HTMLSelectElement).value =
			this.startDay.toString();

		settings.appendChild(weekStart);

		// Clear storage button
		const clearStorageData: string = `
			<button id="clearStorage" class="clear-storage btn btn-danger">Clear Storage</button>
		`;

		const clearStorage: HTMLElement = this.utility.convertHtml(clearStorageData);
		clearStorage.addEventListener("click", (): void => {
			if (
				confirm(
					"Are you sure you want to clear all data?\nThis is permanent and can not be undone."
				)
			) {
				this.utility.clearStorage();
				this.utility.notify("success", "Storage cleared!");
			}
		});
		container.appendChild(clearStorage);

		// Buttons
		const buttons: HTMLElement = this.getButtons();

		container.appendChild(buttons);

		// Add the container to the page.
		target.appendChild(container);
	}

	getSettings(): void {
		// Gets settings from the page and updates the class properties.
		this.utility.log("Getting settings.");

		// Show events
		this.showEvents = (document.getElementById("showEvents") as HTMLInputElement).checked;

		// Planned weeks
		this.planDistance = parseInt(
			(document.getElementById("plannedWeeks") as HTMLInputElement).value
		);

		// Week start day
		this.startDay = parseInt((document.getElementById("weekStart") as HTMLSelectElement).value);

		this.utility.log(`Settings: ${JSON.stringify(this)}`);
	}

	restoreSettings() {
		// Restores the settings to their previous state if the user presses the cancel button.
		this.utility.log("Restoring settings.");

		// Show events
		(document.getElementById("showEvents") as HTMLInputElement).checked = this.showEvents;

		// Planned weeks
		(document.getElementById("plannedWeeks") as HTMLInputElement).value =
			this.planDistance.toString();

		// Week start day
		(document.getElementById("weekStart") as HTMLSelectElement).value =
			this.startDay.toString();
	}
}
