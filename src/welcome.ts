browser.runtime.onInstalled.addListener((details: browser.runtime._OnInstalledDetails): void => {
	if (details.reason === "install") {
		browser.tabs.create({ url: "welcome.html" });
	}
});
