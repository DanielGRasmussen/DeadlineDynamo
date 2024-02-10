class Utility {
	alerter(message: string): void {
		// TODO: Make it much more smooth lol.
		console.log(message);
	}

	createHtmlFromJson(data: HtmlElement): HTMLElement {
		const element: HTMLElement = document.createElement(data.element);

		for (const key in data.attributes) {
			element.setAttribute(key, data.attributes[key]);
		}

		if (data.textContent) {
			element.textContent = data.textContent;
		}

		if (data.innerHTML) {
			element.innerHTML = data.innerHTML;
		}

		if (data.children) {
			for (const childData of data.children) {
				const child = this.createHtmlFromJson(childData);
				element.appendChild(child);
			}
		}
		return element;
	}

	async loadSettings(): Promise<SettingsJson> {
		const settingsJson: string | null = await this.loadStorage("settings");
		// Default settings. To be overridden if settings are found in local storage.
		let settings: SettingsJson = {
			prioritizePoorGrades: false,
			workHours: {
				monday: 6,
				tuesday: 6,
				wednesday: 6,
				thursday: 6,
				friday: 6,
				saturday: 6,
				sunday: 0
			},
			estimateMultiplier: {}
		};

		if (settingsJson === null) {
			// Default estimateMultiplier
			const courseIds: string | null = await this.loadStorage("courseIds");
			if (courseIds !== null) {
				// Set default estimate multipliers.
				const ids: string[] = JSON.parse(courseIds);
				for (const id of ids) {
					settings.estimateMultiplier[id] = 1;
				}
			}
		} else {
			settings = JSON.parse(settingsJson);
		}
		return settings;
	}

	async loadStorage(key: string): Promise<string | null> {
		const data: string | null = await localStorage.getItem(key);
		return data;
	}

	async saveStorage(key: string, data: string): Promise<void> {
		await localStorage.setItem(key, data);
	}
}
