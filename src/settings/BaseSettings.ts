abstract class BaseSettings {
	useBasicEstimate: boolean;
	useHistoryEstimate: boolean;
	workHours: WorkHours;
	estimateMultiplier: EstimateMultiplier;
	planDistance: number;
	showEvents: boolean;
	startDay: number;
	openInNewTab: boolean;
	log: boolean;

	constructor() {
		this.useBasicEstimate = g_settings.useBasicEstimate;
		this.useHistoryEstimate = g_settings.useHistoryEstimate;
		this.workHours = g_settings.workHours;
		this.estimateMultiplier = g_settings.estimateMultiplier;
		this.planDistance = g_settings.planDistance;
		this.showEvents = g_settings.showEvents;
		this.startDay = g_settings.startDay;
		this.openInNewTab = g_settings.openInNewTab;
		this.log = g_settings.log;

		// Open nav.
		const toggle: HTMLElement | null = document.querySelector("#courseMenuToggle");
		if (toggle) {
			toggle.click();
		}

		this.addHeaderLocation();
		this.addActiveLink();
		this.createSettingsPage();
	}

	abstract getName(): string;
	abstract getClass(): string;

	addHeaderLocation(): void {
		// Adds the location to the header.
		utility.log("Adding location to the header.");
		const header: HTMLElement | null = document.querySelector("#breadcrumbs ul");
		if (header === null) {
			// This triggers when on mobile.
			utility.notify("error", "Couldn't find the header.");
			return;
		}

		const locationData: string = `
			<li>
				<span class="ellipsible">${this.getName()}</span>
			</li>
		`;

		const location: HTMLElement = utility.convertHtml(locationData);

		header.appendChild(location);
	}

	addActiveLink(): void {
		document.querySelector(`.dd-nav .${this.getClass()}`)!.classList.add("active");
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

		const buttons: HTMLElement = utility.convertHtml(buttonsData);

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
			openInNewTab: this.openInNewTab,
			log: this.log
		});
		utility.saveStorage("settings", settings);

		utility.notify("success", "Settings saved!");
	}
}
