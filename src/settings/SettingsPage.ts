abstract class SettingsPage {
	utility: Utility = new Utility();
	useBasicEstimate!: boolean;
	useHistoryEstimate!: boolean;
	workHours!: WorkHours;
	estimateMultiplier!: EstimateMultiplier;
	planDistance!: number;
	showEvents!: boolean;

	constructor(settings: Settings) {
		this.useBasicEstimate = settings.useBasicEstimate;
		this.useHistoryEstimate = settings.useHistoryEstimate;
		this.workHours = settings.workHours;
		this.estimateMultiplier = settings.estimateMultiplier;
		this.planDistance = settings.planDistance;
		this.showEvents = settings.showEvents;

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
			this.utility.alerter("Couldn't find the header.");
			return;
		}

		const locationJson: HtmlElement = {
			element: "li",
			children: [
				{
					element: "span",
					attributes: { class: "ellipsible" },
					textContent: this.getName()
				}
			]
		};
		const location: HTMLElement = this.utility.createHtmlFromJson(locationJson);

		header.appendChild(location);
	}

	abstract createSettingsPage(): Promise<void>;

	getButtons(): HTMLElement {
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

		return buttons;
	}

	abstract getSettings(): void;

	abstract restoreSettings(): void;

	async saveSettings(): Promise<void> {
		// Stringifies and saves the settings to local storage.
		const settings: string = JSON.stringify({
			useBasicEstimate: this.useBasicEstimate,
			useHistoryEstimate: this.useHistoryEstimate,
			workHours: this.workHours,
			estimateMultiplier: this.estimateMultiplier,
			planDistance: this.planDistance,
			showEvents: this.showEvents
		});
		await this.utility.saveStorage("settings", settings);

		this.utility.alerter("Settings saved!");
	}
}
