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

	async loadStorage(key: string): Promise<string | null> {
		const data: string | null = await localStorage.getItem(key);
		return data;
	}

	async saveStorage(key: string, data: string): Promise<void> {
		await localStorage.setItem(key, data);
	}
}
