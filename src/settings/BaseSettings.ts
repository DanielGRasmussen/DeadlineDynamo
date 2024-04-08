abstract class BaseSettings {
	utility: Utility = new Utility();
	useBasicEstimate: boolean;
	useHistoryEstimate: boolean;
	workHours: WorkHours;
	estimateMultiplier: EstimateMultiplier;
	planDistance: number;
	showEvents: boolean;
	startDay: number;
	log: boolean;

	constructor(settings: Settings) {
		this.useBasicEstimate = settings.useBasicEstimate;
		this.useHistoryEstimate = settings.useHistoryEstimate;
		this.workHours = settings.workHours;
		this.estimateMultiplier = settings.estimateMultiplier;
		this.planDistance = settings.planDistance;
		this.showEvents = settings.showEvents;
		this.startDay = settings.startDay;
		this.log = settings.log;

		// Open nav.
		const toggle: HTMLElement | null = document.querySelector("#courseMenuToggle");
		if (toggle) {
			toggle.click();
		}

		this.addHeaderLocation();
		this.createSettingsPage();
	}

	abstract getName(): string;

	addHeaderLocation(): void {
		// Adds the location to the header.
		this.utility.log("Adding location to the header.");
		const header: HTMLElement | null = document.querySelector("#breadcrumbs ul");
		if (header === null) {
			// This triggers when on mobile.
			this.utility.notify("error", "Couldn't find the header.");
			return;
		}

		const locationData: string = `
			<li>
				<span class="ellipsible">${this.getName()}</span>
			</li>
		`;

		const location: HTMLElement = this.utility.convertHtml(locationData);

		header.appendChild(location);
	}

	abstract createSettingsPage(): Promise<void>;

	getButtons(): HTMLElement {
		// Buttons
		const buttonsData: string = `
			<div class="button-container">
				<button id="cancel-button" class="btn cancel_button">Cancel</button>
				<button id="save-button" class="btn btn-primary">Update Settings</button>
			</div>
		`;

		const buttons: HTMLElement = this.utility.convertHtml(buttonsData);

		// Add event listeners to the buttons
		const cancelButton: Element = buttons.querySelector("#cancel-button")!;
		const saveButton: Node = buttons.querySelector("#save-button")!;

		cancelButton.addEventListener("click", (): void => {
			this.restoreSettings();
		});
		saveButton.addEventListener("click", (): void => {
			this.getSettings();
			this.saveSettings();
		});

		return buttons;
	}

	abstract getSettings(): void;

	abstract restoreSettings(): void;

	saveSettings(): void {
		// Stringifies and saves the settings to local storage.
		const settings: string = JSON.stringify({
			useBasicEstimate: this.useBasicEstimate,
			useHistoryEstimate: this.useHistoryEstimate,
			workHours: this.workHours,
			estimateMultiplier: this.estimateMultiplier,
			planDistance: this.planDistance,
			showEvents: this.showEvents,
			startDay: this.startDay,
			log: this.log
		});
		this.utility.saveStorage("settings", settings);

		this.utility.notify("success", "Settings saved!");
	}
}
