class PlannerPreparer {
	// This runs at the document start to check for mutations and trigger our modifications immediately.
	utility: Utility = new Utility();

	constructor() {
		const observer = new MutationObserver(this.listener.bind(this));
		observer.observe(document, { childList: true, subtree: true });
	}

	// Prepare the settings page.
	listener(mutationsList: MutationRecord[]): void {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach(node => {
					const element: HTMLElement = node as HTMLElement;

					if (element.id === "dashboard-planner") {
						element.remove();
					}
				});
			}
		}
	}
}

new PlannerPreparer();
