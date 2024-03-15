class SettingsMain extends SettingsPage {
	getName(): string {
		return "Main";
	}

	async createSettingsPage(): Promise<void> {
		// Creates the settings page.
		this.utility.log("Creating the main settings.");
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
					textContent: "Main Settings"
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

		// Show events
		const showEventsJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "show-events"
			},
			children: [
				{
					element: "label",
					attributes: {
						for: "showEvents"
					},
					textContent: "Show events: "
				},
				{
					element: "input",
					attributes: {
						type: "checkbox",
						id: "showEvents"
					}
				}
			]
		};

		const showEvents: HTMLElement = this.utility.createHtmlFromJson(showEventsJson);

		settings.appendChild(showEvents);

		// Load the current value from storage
		if (this.showEvents) {
			(showEvents.querySelector("#showEvents") as HTMLInputElement).checked = true;
		}

		// Planned weeks
		const plannedWeeksJson: HtmlElement = {
			element: "div",
			attributes: {
				class: "planned-weeks"
			},
			children: [
				{
					element: "label",
					attributes: {
						for: "plannedWeeks"
					},
					textContent: "Planned weeks: "
				},
				{
					element: "input",
					attributes: {
						type: "number",
						id: "plannedWeeks",
						class: "planned-weeks",
						min: "1",
						max: "8",
						value: this.planDistance.toString()
					}
				}
			]
		};

		const plannedWeeks: HTMLElement = this.utility.createHtmlFromJson(plannedWeeksJson);

		settings.appendChild(plannedWeeks);

		// Clear storage button
		const clearStorageJson: HtmlElement = {
			element: "button",
			attributes: {
				id: "clearStorage",
				class: "clear-storage btn btn-danger"
			},
			textContent: "Clear Storage"
		};
		const clearStorage: HTMLElement = this.utility.createHtmlFromJson(clearStorageJson);
		clearStorage.addEventListener("click", (): void => {
			if (
				confirm(
					"Are you sure you want to clear all data?\nThis is permanent and can not be undone."
				)
			) {
				this.utility.clearStorage();
				this.utility.alerter("Storage cleared!");
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
	}
}
