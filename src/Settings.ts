class Settings {
	useBasicEstimate!: boolean;
	useHistoryEstimate!: boolean;
	workHours!: WorkHours;
	estimateMultiplier!: EstimateMultiplier;
	planDistance!: number;
	showEvents!: boolean;
	// Start day is 0 for Sunday, 1 for Monday, etc.
	startDay!: number;
	// Determines if assignments open up in current tab or new tab.
	openInNewTab!: boolean;
	// Determines if utility.log() should log.
	log!: boolean;

	constructor() {
		// Load settings from storage.
		this.useBasicEstimate = g_settings.useBasicEstimate;
		this.useHistoryEstimate = g_settings.useHistoryEstimate;
		this.workHours = g_settings.workHours;
		this.estimateMultiplier = g_settings.estimateMultiplier;
		this.planDistance = g_settings.planDistance;
		this.showEvents = g_settings.showEvents;
		this.startDay = g_settings.startDay;
		this.openInNewTab = g_settings.openInNewTab;
		this.log = g_settings.log;

		this.createSettings();
	}

	createSettings(): void {
		// Remove trailing slash.
		const location: string = window.location.href.replace(/\/$/, "");
		if (location.endsWith("/deadline-dynamo")) {
			utility.log("Creating the main settings.");
			new MainSettings();
		} else if (location.endsWith("/deadline-dynamo/estimates-planning")) {
			utility.log("Creating the estimates & planning settings.");
			new EstimatesPlanningSettings();
		} else if (location.endsWith("/deadline-dynamo/developer")) {
			utility.log("Creating the developer settings.");
			new DeveloperSettings();
		}
	}
}

new Settings();
