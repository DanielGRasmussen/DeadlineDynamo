class Utility {
	domParser: DOMParser = new DOMParser();
	location: string = window.location.host.split(".")[0];
	logging: boolean = false;
	logs: string[] = [];

	constructor() {
		this.loadSettings().then((settings: SettingsJson): void => {
			g_settings = settings;

			this.loadPlan().then((plan: Plan): void => {
				g_plan = plan;
				this.log("Plan loaded.");
			});

			// While developing I might change the default value of log so I want to make sure it's always correct.
			if (settings.log !== this.logging) {
				this.logging = settings.log;
				this.log("Logging setting changed.");
			}
		});
	}

	log(message: string): void {
		if (this.logging) {
			for (let i: number = 0; i < this.logs.length; i++) {
				const log: string | undefined = this.logs.pop();
				if (log !== undefined) {
					console.log(log);
				}
			}

			console.log(message);
		} else {
			this.logs.push(message);
		}
	}

	notify(type: "error" | "warning" | "info" | "success", message: string): void {
		let alertContainer: Element | null = document.getElementsByClassName("alert-container")[0];
		if (!alertContainer) {
			alertContainer = this.convertHtml(`<div class="alert-container"></div>`);

			document.querySelector("html")?.appendChild(alertContainer);
		}

		const alert: HTMLElement = this.convertHtml(`
			<div class="message-alert ${type}">
				<p>${message}</p>
				<span class="close-alert">
					<svg viewBox="0 0 1920 1920" focusable="false" class="css-1uh2md0-inlineSVG-svgIcon"><g><path d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z"></path></g></svg>
				</span>
			</div>
		`);

		alert
			.querySelector(".close-alert")
			?.addEventListener("click", this.removeAlert.bind(this, alert));

		alertContainer.appendChild(alert);

		// Using .then instead of await so that way we don't ignore promises.
		this.wait(10000).then(this.removeAlert.bind(this, alert));
	}

	async removeAlert(alert: HTMLElement): Promise<void> {
		alert.classList.add("fade-out");
		await this.wait(500);
		alert.remove();
	}

	convertHtml(data: string): HTMLElement {
		const element: Document = this.domParser.parseFromString(data, "text/html");
		return element.body.firstChild as HTMLElement;
	}

	scrollToToday(): void {
		this.log("Scrolling to today.");
		const date: string = new Date().toISOString().slice(0, 10);

		const today: Element | undefined = document.getElementsByClassName(`day-${date}`)[0];

		if (today === undefined) {
			this.notify("error", "Today not found.");
			return;
		}

		// Get the top of the element.
		const elementRect: DOMRect | undefined = today.parentElement?.getBoundingClientRect();

		if (elementRect === undefined) {
			this.notify("error", "Element not found.");
			return;
		}

		const desiredY: number = elementRect.top + window.scrollY - 80;

		window.scrollTo({ top: desiredY, behavior: "smooth" });
	}

	wait(ms: number): Promise<void> {
		this.log(`Waiting for ${ms}ms.`);
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async loadStorage(key: string): Promise<string | undefined> {
		const name: string = `${this.location}-${key}`;
		this.log(`Loading ${name} from storage.`);
		const info: { [p: string]: string } = await browser.storage.sync.get(name);
		return info[name];
	}

	async loadSettings(): Promise<SettingsJson> {
		this.log("Loading settings from storage.");
		const settingsJson: string | undefined = await this.loadStorage("settings");
		// Default settings. To be overridden if settings are found in storage.
		let settings: SettingsJson = {
			useBasicEstimate: true,
			useHistoryEstimate: true,
			workHours: {
				monday: 6,
				tuesday: 6,
				wednesday: 6,
				thursday: 6,
				friday: 6,
				saturday: 6,
				sunday: 0
			},
			estimateMultiplier: {},
			planDistance: 1,
			showEvents: true,
			startDay: 1,
			openInNewTab: true,
			log: false
		};

		if (settingsJson === undefined) {
			// Default estimateMultiplier
			this.log("No settings found. Using default settings.");

			const courseIds: string | undefined = await this.loadStorage("courseIds");
			if (courseIds !== undefined) {
				// Set default estimate multipliers.
				const ids: string[] = JSON.parse(courseIds);
				for (const id of ids) {
					settings.estimateMultiplier[id] = 1;
				}
			}
		} else {
			this.log("Settings found.");
			// Set values to default for anything that's undefined.
			settings = { ...settings, ...JSON.parse(settingsJson) };
		}

		this.log(JSON.stringify(settings));
		return settings;
	}

	async loadPlan(): Promise<Plan> {
		this.log("Loading plan from storage.");
		const plan: string | undefined = await this.loadStorage("plan");
		if (plan === undefined) {
			// Create an empty plan for this week.
			const start: Date = this.getWeekStart(new Date());
			const plan: Plan = {};
			for (let i: number = 0; i < 5; i++) {
				const day: Date = new Date(start);
				day.setDate(day.getDate() + i);
				plan[day.toISOString().slice(0, 10)] = [];
			}

			return plan;
		} else {
			const planObject: Plan = JSON.parse(plan);
			// Convert all the dates back to Date objects.
			for (const date in planObject) {
				planObject[date].forEach(planItem => {
					planItem.due_date = new Date(planItem.due_date);
				});
			}

			return planObject;
		}
	}

	saveStorage(key: string, data: string): void {
		const name: string = `${this.location}-${key}`;
		this.log(`Saving ${name} to storage.`);
		try {
			const info: { [p: string]: string } = {};
			info[name] = data;
			browser.storage.sync.set(info).then(_ => {});
		} catch (error) {
			// This likely happened because of too much data trying to be saved.
			console.log(key);
			console.log(data);
		}
	}

	async clearStorage(): Promise<void> {
		this.log("Clearing storage.");
		await browser.storage.sync.clear();
	}

	formatDate(date: Date, shortDay: boolean): [string, string] {
		let dayOfWeek: string;
		if (shortDay) {
			dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });
		} else {
			dayOfWeek = date.toLocaleString("en-US", { weekday: "long" });
		}

		const month: string = date.toLocaleString("en-US", { month: "short" });
		const day: number = date.getDate();
		// Got this from the internet. Just assigns the correct ordinal to the day.
		const ordinal: "th" | "st" | "nd" | "rd" =
			day === 11 || day === 12 || day === 13
				? "th"
				: day % 10 === 1
					? "st"
					: day % 10 === 2
						? "nd"
						: day % 10 === 3
							? "rd"
							: "th";

		const formattedDate: string = `${dayOfWeek}, ${month} ${day}${ordinal}`;

		// Format the time part
		let hour: number = date.getHours();
		const minute: string = date.getMinutes().toString().padStart(2, "0");
		const meridian: "am" | "pm" = hour < 12 ? "am" : "pm";

		// So noon is 12pm.
		hour %= 12;
		if (hour === 0) {
			hour = 12;
		}

		const formattedTime: string = `${hour}:${minute} ${meridian}`;

		// Combine the date and time parts
		return [formattedDate, formattedTime];
	}

	getWeekStart(date: Date, offset: number = 0): Date {
		// Gets the start of the week for the given date. Offset is the number of weeks to go back. 0 is the current
		// week, 1 is the previous week, etc.
		const start: Date = new Date(date);

		// Subtract the number of days since the start of the week to get the start day.
		start.setDate(start.getDate() - start.getDay() + g_settings.startDay - 1 + offset * 7);

		// If the start day is set to after the current day, go back a week.
		if (start > date) {
			start.setDate(start.getDate() - 7);
		}

		start.setHours(0, 0, 0, 0);
		return start;
	}

	daysUntil(date: Date): number {
		// Gets days between the monday and the date.
		const start: Date = this.getWeekStart(new Date());
		const difference: number = date.getTime() - start.getTime();
		return Math.ceil(difference / (1000 * 60 * 60 * 24));
	}

	parseLinkHeader(linkHeader: string | null): { [rel: string]: string } {
		if (!linkHeader) {
			return {};
		}
		this.log("Parsing link header.");

		const links: { [rel: string]: string } = {};
		const parts: string[] = linkHeader.split(",");

		for (const part of parts) {
			const [url, rel] = part.trim().split(";");
			links[rel.split("=")[1].slice(1, -1)] = url.trim().slice(1, -1);
		}

		return links;
	}

	isTouchDevice(): boolean {
		// Combine multiple detection methods for increased accuracy:
		return (
			("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
			!window.matchMedia("(pointer: none)").matches
		); // Exclude devices with only pen/stylus input
	}
}

// If these are globals then not every single class has to load them up. Just about everything waits on these to
// load. So it's better to have them load once as early as possible and then be available to everything.
const utility: Utility = new Utility();
let g_settings!: SettingsJson;
let g_plan!: Plan;
