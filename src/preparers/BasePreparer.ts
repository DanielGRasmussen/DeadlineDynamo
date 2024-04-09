abstract class BasePreparer {
	observer: MutationObserver = new MutationObserver(this.listener.bind(this));
	conditions: Condition[];

	constructor() {
		this.conditions = this.getConditions();
		utility.log(`Got ${this.conditions.length} conditions.`);

		this.observer.observe(document, { childList: true, subtree: true });
		utility.log("Started observer.");
	}

	abstract getConditions(): Condition[];

	listener(mutations: MutationRecord[]): void {
		// Goes through the mutations and checks if any of the conditions given by getConditions are met.
		// The goal of this is to catch any changes that we don't like and remove them or use them as a reference to
		// make our own changes.
		// This is to make sure that the changes don't appear for a split second before we remove them.

		for (const mutation of mutations) {
			// We only need to check for added nodes.
			if (mutation.type !== "childList") {
				continue;
			}

			mutation.addedNodes.forEach(node => {
				if (!(node instanceof HTMLElement)) {
					// Not an element.
					return;
				}
				const parent: HTMLElement | null = node.parentElement;

				let anyChecked: boolean = false;
				for (const condition of this.conditions) {
					const checks: Check[] = condition.checks;

					if (condition.triggerOnce && condition.triggered) {
						// This condition doesn't need to go more than once, and it has already been triggered.
						continue;
					}
					anyChecked = true;

					const passed: boolean[] = [];
					for (const check of checks) {
						const checkType: CheckTypes = check[0];
						const checkValue: CheckValue = check[1];

						switch (checkType) {
							case "tag":
								passed.push(node.tagName.toLowerCase() === checkValue);
								break;
							case "id":
								passed.push(node.id === checkValue);
								break;
							case "class":
								passed.push(node.classList.contains(checkValue as string));
								break;
							case "notClass":
								passed.push(
									!node.classList ||
										!node.classList.contains(checkValue as string)
								);
								break;
							case "querySelector":
								passed.push(node.querySelector(checkValue as string) !== null);
								break;
							case "parentTag":
								passed.push(
									parent !== null && parent.tagName.toLowerCase() === checkValue
								);
								break;
							case "parentId":
								passed.push(parent !== null && parent.id === checkValue);
								break;
							case "boolCheck":
								passed.push(checkValue as boolean);
								break;
							case "funcCheck":
								passed.push((checkValue as (node: HTMLElement) => boolean)(node));
								break;
						}

						if (!condition.all && passed.includes(true)) {
							// Only one check needs to be true and one is true.
							condition.callback(node);
							condition.triggered = true;
							break;
						}
					}

					if (condition.all && !passed.includes(false)) {
						// All checks need to be true and all are true.
						condition.callback(node);
						condition.triggered = true;
					}
				}

				if (!anyChecked) {
					// No conditions checked. No point in continuing to listen.
					utility.log("No conditions checked. Disconnecting observer.");
					this.observer.disconnect();
				}
			});
		}
	}
}
