chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails): void => {
	if (details.reason === "install") {
		chrome.tabs.create({ url: "welcome.html" });
	}
});
