class Settings {
	utility: Utility = new Utility();
	useBasicEstimate!: boolean;
	useHistoryEstimate!: boolean;
	workHours!: WorkHours;
	estimateMultiplier!: EstimateMultiplier;
	planDistance!: number;
	showEvents!: boolean;
	// Start day is 0 for Sunday, 1 for Monday, etc.
	startDay!: number;

	constructor() {
		// Load settings from storage.
		this.utility.loadSettings().then((settings: SettingsJson) => {
			this.useBasicEstimate = settings.useBasicEstimate;
			this.useHistoryEstimate = settings.useHistoryEstimate;
			this.workHours = settings.workHours;
			this.estimateMultiplier = settings.estimateMultiplier;
			this.planDistance = settings.planDistance;
			this.showEvents = settings.showEvents;
			this.startDay = settings.startDay;

			this.createSettings();
		});
	}

	createSettings(): void {
		// Remove trailing slash.
		const location: string = window.location.href.replace(/\/$/, "");
		if (location.endsWith("/deadline-dynamo")) {
			this.utility.log("Creating the main settings.");
			new MainSettings(this);
		} else if (location.endsWith("/deadline-dynamo/estimates-planning")) {
			this.utility.log("Creating the estimates & planning settings.");
			new EstimatesPlanningSettings(this);
		}
	}
}

new Settings();
