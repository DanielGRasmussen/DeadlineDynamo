class DeveloperSettings extends BaseSettings {
	getName(): string {
		return "Developer";
	}

	getClass(): string {
		return "developer";
	}

	async createSettingsPage(): Promise<void> {
		// Creates the settings page.
		utility.log("Creating the developer settings.");
		const target: Element | null = document.querySelector("div.settings-wrapper");
		if (target === null) {
			utility.notify("error", "Couldn't find the content wrapper.");
			return;
		}

		// Container for the list of items
		const containerData: string = `
			<div class="settings-container">
				<h1>Developer Settings</h1>
				<div class="settings"></div>
			</div>
		`;

		const container: HTMLElement = utility.convertHtml(containerData);
		const settings: Element = container.querySelector(".settings")!;

		// Show events
		const loggingData: string = `
			<div class="logging">
				<label for="Logging">Log Data: </label>
				<input type="checkbox" id="Logging">
			</div>
		`;

		const logging: HTMLElement = utility.convertHtml(loggingData);

		settings.appendChild(logging);

		// Load the current value from storage
		if (this.log) {
			(logging.querySelector("#Logging") as HTMLInputElement).checked = true;
		}

		// Clear storage button
		const clearStorageData: string = `
			<button id="clearStorage" class="clear-storage btn btn-danger">Clear Storage</button>
		`;

		const clearStorage: HTMLElement = utility.convertHtml(clearStorageData);
		clearStorage.addEventListener("click", (): void => {
			if (
				confirm(
					"Are you sure you want to clear all data?\nThis is permanent and can not be undone."
				)
			) {
				utility.clearStorage();
				utility.notify("success", "Storage cleared!");
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
		utility.log("Getting settings.");

		// Logging
		this.log = (document.querySelector("#Logging") as HTMLInputElement).checked;

		utility.log(`Settings: ${JSON.stringify(this)}`);
	}

	restoreSettings() {
		// Restores the settings to their previous state if the user presses the cancel button.
		utility.log("Restoring settings.");

		// Logging
		(document.querySelector("#Logging") as HTMLInputElement).checked = this.log;
	}
}
