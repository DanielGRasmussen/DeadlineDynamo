class PlannerPreparer {
	utility: Utility = new Utility();
	observer: MutationObserver = new MutationObserver(this.listener.bind(this));
	removedDefaultPlanner: boolean = false;
	addedPlanner: boolean = false;
	addedSidebarButton: boolean = false;
	triggeredMain: boolean = false;
	clickedTodoClose: boolean = false;
	main: Main = new Main();

	constructor() {
		this.observer.observe(document, { childList: true, subtree: true });
	}

	// Prepare the settings page.
	listener(mutationsList: MutationRecord[]): void {
		// The goal of this is to catch any changes that we don't like and remove them or use them as a reference to
		// make our own changes.
		// This is to make sure that the changes don't appear for a split second before we remove them.
		for (const mutation of mutationsList) {
			if (mutation.type !== "childList") {
				continue;
			}

			mutation.addedNodes.forEach(node => {
				// So that we can make sure it is an HTMLElement and has the methods/attributes we check.
				if (!(node instanceof HTMLElement)) {
					return;
				}

				if (!this.removedDefaultPlanner && node.id === "dashboard-planner") {
					// Remove the canvas planner element.
					node.remove();
					this.removedDefaultPlanner = true;
				} else if (!this.addedPlanner && node.id === "dashboard_header_container") {
					// Add our planner element where the original planner was (after #dashboard_header_container).
					const plannerJson: HtmlElement = {
						element: "div",
						attributes: { id: "deadline-dynamo-planner" }
					};

					const planner: HTMLElement = this.utility.createHtmlFromJson(plannerJson);

					node.after(planner);
					this.addedPlanner = true;

					// Spinner while the plan is loading.
					this.createSpinner();
				} else if (
					// This checks for when the add assignment button is added.
					// It is added as a child of the planner header.
					!this.addedSidebarButton &&
					node.parentElement?.id === "dashboard-planner-header" &&
					node.getAttribute("data-testid") === "PlannerHeader"
				) {
					// Create our sidebar button.
					this.createSidebarButton();
					this.addedSidebarButton = true;
				} else if (
					!this.clickedTodoClose &&
					node.querySelector(
						"div[aria-label='Add To Do'] span.css-19r6qv1-closeButton button"
					)
				) {
					// When we remove some element in the original planner the todo sidebar close button doesn't
					// work the first time it's pressed. This fixes it by clicking it an extra time when it is
					// clicked. Very hacky. But it should be effective.
					const closeButton: HTMLButtonElement | null = node.querySelector(
						"span.css-19r6qv1-closeButton button"
					);

					if (closeButton === null) {
						this.utility.alerter("Error: Close button not found.");
						return;
					}

					closeButton.addEventListener("click", closeButton.click);
					this.clickedTodoClose = true;
				}

				if (this.addedPlanner && this.addedSidebarButton && !this.triggeredMain) {
					// This will make the planner load.
					if (this.main.courses === undefined) {
						this.utility.alerter("Error: No courses found!");
						return;
					}

					new Planner(this.main.courses, this.main.estimator, this.utility);

					this.triggeredMain = true;
				}

				if (
					this.removedDefaultPlanner &&
					this.addedPlanner &&
					this.addedSidebarButton &&
					this.clickedTodoClose
				) {
					// We're done here.
					this.observer.disconnect();
				}
			});
		}
	}

	createSpinner(): void {
		// Adds the spinner for the main planning UI.
		// This gets the "hidden" class added to it when the planner is done loading.
		const spinnerJson: HtmlElement = {
			element: "div",
			attributes: { class: "deadline-dynamo-spinner" },
			innerHTML: `
				<svg class="spinner" viewBox="0 0 50 50">
 					<circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
				</svg>`
		};

		const spinner: HTMLElement = this.utility.createHtmlFromJson(spinnerJson);

		const planner: HTMLElement | null = document.querySelector("#deadline-dynamo-planner");

		if (planner === null) {
			this.utility.alerter("Error: Planner not found.");
			return;
		}

		planner.append(spinner);
	}

	createSidebarButton(): void {
		// Adds the sidebar button next to the "add assignment button" that is in the top header.
		const buttonSibling: HTMLElement | null = document.querySelector(
			"button[data-testid='add-to-do-button']"
		);

		if (buttonSibling === null) {
			this.utility.alerter("Error: Button sibling not found.");
			return;
		}

		// Get button's class so we can use it and match the UI.
		const buttonClass: string = buttonSibling.classList[0];

		const buttonJson: HtmlElement = {
			element: "button",
			attributes: {
				cursor: "pointer",
				type: "button",
				tabindex: "0",
				class: `${buttonClass} deadline-dynamo-sidebar-button`
			},
			children: [
				{
					element: "span",
					attributes: { class: "css-1eaecfq-baseButton__content" },
					children: [
						{
							element: "span",
							attributes: { class: "css-qi8ml9-baseButton__childrenLayout" },
							children: [
								{
									element: "span",
									attributes: { class: "css-5udsuu-baseButton__iconOnly" },
									children: [
										{
											element: "span",
											attributes: { class: "css-quqv7u-baseButton__iconSVG" },
											innerHTML:
												`<svg height="1em" width="1em" id="_x32_" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xml:space="preserve" fill="#ffffff" stroke="#ffffff">` +
												`<g id="SVGRepo_iconCarrier">` +
												`<style type="text/css">` +
												`.st1{fill:black;}` +
												`</style>` +
												`<g>` +
												`<path class="st1" d="M190.5,213.96c-3.887,5.298-3.314,12.346,1.299,15.726l55.58,42.879l0.774,0.444l0.347,0.193 c4.806,2.677,11.17,1.258,15.411-3.412l0.371-0.354l68.121-80.597c3.879-4.347,3.944-10.605,0.17-13.96 c-3.782-3.363-9.984-2.556-13.847,1.79l-63.678,68.024l-49.161-34.235C201.29,207.073,194.395,208.645,190.5,213.96z"/>` +
												`<path class="st1" d="M60.152,245.726c-0.249,3.371-0.314,6.806-0.314,10.234c0,3.5,0.064,6.871,0.314,10.242h40.694 c-0.364-3.371-0.436-6.798-0.436-10.242c0-3.427,0.072-6.862,0.436-10.234H60.152z"/>` +
												`<path class="st1" d="M165.419,82.016c-5.072,2.565-10.016,5.404-14.814,8.517l20.29,35.234l1.492-1.008 c3.846-2.436,7.774-4.734,11.758-6.766l1.557-0.75L165.419,82.016z"/>` +
												`<path class="st1" d="M90.548,150.596c-3.112,4.799-5.952,9.734-8.516,14.807l35.234,20.282l8.524-14.798L90.548,150.596z"/>` +
												`<path class="st1" d="M125.79,340.976l-1.024-1.492c-2.428-3.79-4.726-7.71-6.758-11.766l-0.814-1.548l-35.161,20.282 c2.5,5.073,5.403,10.008,8.516,14.806L125.79,340.976z"/>` +
												`<path class="st1" d="M172.387,387.097l-1.492-1.016l-20.29,35.241c4.798,3.113,9.742,6.016,14.814,8.589l20.283-35.234l-1.557-0.75 C180.161,391.903,176.234,389.605,172.387,387.097z"/>` +
												`<path class="st1" d="M361.282,90.532c-4.798-3.113-9.678-5.952-14.734-8.517l-20.363,35.162l14.806,8.588L361.282,90.532z"/>` +
												`<path class="st1" d="M266.209,100.838V60.201c-3.371-0.306-6.798-0.371-10.242-0.371c-3.428,0-6.855,0.064-10.234,0.371v40.637 v0.428h20.476V100.838z"/>` +
												`<path class="st1" d="M386.064,170.863l7.847,13.541l0.742,1.322l0.25-0.169l35.016-20.145c-2.564-5.121-5.451-9.992-8.588-14.783 L386.064,170.863z"/>` +
												`<path class="st1" d="M448.992,266.072c0.17,0.089,0.17,0.089,0.17,0.169h2.637c0.25-3.386,0.331-6.854,0.331-10.322 c0-3.387-0.081-6.854-0.331-10.161h-25.186c0.331,0.249,0.662,0.58,0.992,0.83L448.992,266.072z"/>` +
												`<path class="st1" d="M256,0C114.54,0,0,114.54,0,256c0,141.379,114.54,255.919,256,256c15.282,0,30.306-1.403,44.847-3.96 c-12.637-7.847-23.782-17.839-33.032-29.403c-3.887,0.249-7.847,0.33-11.815,0.33c-61.686-0.081-117.258-24.935-157.725-65.323 C57.895,373.266,33.032,317.605,33.032,256c0-61.685,24.862-117.266,65.242-157.726C138.741,57.887,194.314,33.032,256,33.032 c61.605,0,117.186,24.855,157.654,65.242c40.378,40.46,65.234,96.04,65.314,157.726c0,14.621-1.484,28.903-4.129,42.693 c9.58,14.952,16.604,30.726,20.975,46.912C506.306,317.685,512,287.548,512,256C511.919,114.54,397.379,0,256,0z"/>` +
												`<path class="st1" d="M412.702,268.621c-19.315-15.452-26.855-32.484-29.759-44.621c-2.33-9.718-1.105-10.774-1.105-10.774 c-0.096-1.153-0.83-2.153-1.879-2.637c-1.064-0.508-2.29-0.396-3.242,0.266c0,0-3.742,0.807-9.838,6.726 c-13.887,13.467-29.573,35.967-19.242,66.701c11.121,32.976,5.234,39.887-0.572,39.444c-7.532-0.589-8.694-5.226-7.492-19.686 c1.403-16.887-13.92-31.323-13.92-31.323s-23.814,37.855-42.371,64.928c-10.968,15.992-16.226,36.338-16.226,54.887h-0.371 c0,57.08,46.266,103.346,103.339,103.346c57.072,0,103.322-46.266,103.322-103.346C477.282,342.976,450.354,298.75,412.702,268.621 z M370.209,466.782c-31.492,0-57.008-25.524-57.008-57.008c0-10.71,2.968-20.75,8.097-29.306 c4.436,16.491,19.484,28.621,37.363,28.621c21.371,0,38.694-17.315,38.694-38.662c0-4.089-0.646-8.024-1.815-11.709 c18.758,9.322,31.661,28.67,31.661,51.056C427.201,441.258,401.693,466.782,370.209,466.782z"/>` +
												`</g>` +
												`</g>` +
												`</svg>`
										},
										{
											element: "span",
											attributes: {
												class: "css-1sr5vj2-screenReaderContent"
											},
											innerHTML: "Add To Do"
										}
									]
								}
							]
						}
					]
				}
			]
		};

		const button: HTMLElement = this.utility.createHtmlFromJson(buttonJson);

		buttonSibling.after(button);
	}
}

new PlannerPreparer();
