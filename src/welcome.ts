chrome.runtime.onInstalled.addListener((details): void => {
	if (details.reason === "install") {
		chrome.tabs.create({ url: "welcome.html" });
	}
});
