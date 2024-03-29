chrome.runtime.onInstalled.addListener((details): void => {
	console.log(details);
	if (details.reason === "install") {
		chrome.tabs.create({ url: "welcome.html" });
	}
});
