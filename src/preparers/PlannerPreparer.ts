class PlannerPreparer extends BasePreparer {
	// [0] Header buttons are added. [1] Data is done loading.
	loadConditions: boolean[] = data.loadConditions;
	planner: Planner | undefined;
	view!: number;
	// To ignore a view change triggered by us.
	ignoreViewChange: boolean = false;

	constructor() {
		super();
		this.setView().then(_ => {});
	}

	async setView(): Promise<void> {
		const view: string | undefined = await utility.loadStorage("view");

		if (view === undefined) {
			utility.saveStorage("view", "1");
			this.view = 1;
		} else {
			this.view = parseInt(view);
		}

		utility.log(`View: ${this.view}`);

		let body: HTMLBodyElement = document.getElementsByTagName("body")[0];
		while (body === undefined) {
			body = document.getElementsByTagName("body")[0];
			await utility.wait(20);
		}

		if (utility.isTouchDevice()) {
			body.classList.add("dd-touch");
		}

		this.setViewClass();
	}

	setViewClass(): void {
		utility.log(`Setting view to ${this.view}.`);

		const body: HTMLBodyElement = document.getElementsByTagName("body")[0];

		if (this.view === 3) {
			body.classList.add("dd-view");
		} else {
			body.classList.remove("dd-view");
		}
	}

	getConditions(): Condition[] {
		// Since this technically gets called before most of our constructor and defining code runs, we need to
		// define this here, so it will be updated later.
		return [
			// Checks if the view options in the top right have been added, if so then it adds the option for our view.
			{
				checks: [
					[
						"querySelector",
						"ul.css-1dndbkc-menu ul.css-1te3it8-menuItemGroup__items, ul.css-a6zj6t-menu ul.css-1te3it8-menuItemGroup__items"
					],
					["parentTag", "body"]
				],
				all: true,
				callback: this.createViewButton.bind(this),
				triggerOnce: false,
				triggered: false
			},
			// Checks if the planner has been added, if so then it triggers the adds the filler items.
			{
				checks: [["id", "dashboard"]],
				all: true,
				callback: this.addNewPlanner.bind(this),
				triggerOnce: true,
				triggered: false
			},
			// Checks if an element in the header has been added, if so then it adds our header buttons.
			// This checks for when a style element is added to the header. I am not sure what the deal is, but I
			// can not find any point where items with the attributes of the buttons are added. This is shortly
			// thereafter in the process though, so it should work for now.
			{
				checks: [
					["tag", "style"],
					["parentId", "dashboard-planner-header"]
				],
				all: true,
				callback: this.createHeaderButtons.bind(this),
				triggerOnce: true,
				triggered: false
			},
			// Adds the show more button displayed right under the header.
			{
				checks: [["parentId", "dashboard-planner-header"]],
				all: true,
				callback: this.addShowMoreButton.bind(this),
				triggerOnce: true,
				triggered: false
			},
			// Hides the "Nothing planned" message. This appears due to nothing being due on current day.
			// We change how things look, so it is not needed.
			{
				checks: [["funcCheck", this.isNothingPlannedMessage.bind(this)]],
				all: true,
				callback: this.removeNothingPlanned.bind(this),
				triggerOnce: true,
				triggered: false
			}
		];
	}

	createViewButton(node: HTMLElement): void {
		// Adds the view button in the top right dropdown.
		utility.log("Adding view button.");

		let list: HTMLElement | null = node.querySelector(
			"ul.css-1dndbkc-menu ul.css-1te3it8-menuItemGroup__items"
		);

		let iconClass: string = "css-1nl5gro-menuItem__icon";
		if (list === null) {
			list = node.querySelector("ul.css-a6zj6t-menu ul.css-1te3it8-menuItemGroup__items");
			iconClass = "css-1d91lml-menuItem__icon";
		}

		if (list === null) {
			utility.notify("error", "List not found.");
			return;
		}

		const viewButtonExample: HTMLElement = list.querySelector("li > span")!;

		const viewButtonClass: string = viewButtonExample.classList[0];

		// Add the view button.
		const viewButtonData: string = `
			<li role="none" class="dd-view">
				<span tabindex="-1" role="menuitemradio" aria-labelledby="MenuItem__label_3" aria-checked="false" class="${viewButtonClass}">
					<span>
						<span class="${iconClass}"></span>
						<span id="MenuItem__label_3" class="css-1u4c65l-menuItem__label">Deadline Dynamo</span>
					</span>
				</span>
			</li>
		`;

		const viewButton: HTMLElement = utility.convertHtml(viewButtonData);

		list.append(viewButton);

		for (let i: number = 0; i < list.children.length; i++) {
			const child: HTMLElement = list.children[i] as HTMLElement;
			child.addEventListener("click", () => {
				this.changeView(list!, i);
			});
		}
	}

	addNewPlanner(node: HTMLElement): void {
		// Add our planner element where the original planner was (after #dashboard_header_container).
		const plannerData: string = `
			<div id="dd-planner"></div>
		`;

		const planner: HTMLElement = utility.convertHtml(plannerData);

		const originalPlanner: Element | null = node.querySelector("#dashboard_header_container");

		if (!originalPlanner) {
			utility.notify("error", "No header container.");
			return;
		}

		originalPlanner.after(planner);
		utility.log("Added planner.");

		// Adds the spinner for the main planning UI.
		utility.log("Adding spinner.");
		// This gets hidden by css when the planner is loaded.
		const spinnerData: string = `
			<div class="dd-spinner">
				<svg class="spinner" viewBox="0 0 50 50">
 					<circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
				</svg>
			</div>
		`;

		const spinner: HTMLElement = utility.convertHtml(spinnerData);

		planner.append(spinner);

		// Now that the planner is added, we can trigger the planner class.
		utility.log("Triggering the planner.");
		data.planner = new Planner();
	}

	createHeaderButtons(): void {
		// Adds the sidebar button and the announcement button around the"add assignment button" that is in the top
		// header.
		const buttonSibling: HTMLElement | null = document.querySelector(
			"button[data-testid='add-to-do-button']"
		);

		if (buttonSibling === null) {
			utility.notify("error", "Button sibling not found.");
			return;
		}

		// Get button's class, so we can use it and match the UI.
		const buttonClass: string = buttonSibling.classList[0];

		const sidebarButtonData: string = `
			<button class="${buttonClass} dd-sidebar-button" type="button" tabindex="0">
				<span class="css-1eaecfq-baseButton__content">
					<span class="css-qi8ml9-baseButton__childrenLayout">
						<span class="css-5udsuu-baseButton__iconOnly">
							<span class="css-quqv7u-baseButton__iconSVG">
								<svg height="1em" width="1em" id="_x32_" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xml:space="preserve" fill="#ffffff" stroke="#ffffff">
									<g id="SVGRepo_iconCarrier">
										<style type="text/css">
											.st1{fill:black;}
										</style>
										<g>
												<path class="st1" d="M190.5,213.96c-3.887,5.298-3.314,12.346,1.299,15.726l55.58,42.879l0.774,0.444l0.347,0.193 c4.806,2.677,11.17,1.258,15.411-3.412l0.371-0.354l68.121-80.597c3.879-4.347,3.944-10.605,0.17-13.96 c-3.782-3.363-9.984-2.556-13.847,1.79l-63.678,68.024l-49.161-34.235C201.29,207.073,194.395,208.645,190.5,213.96z"/>
												<path class="st1" d="M60.152,245.726c-0.249,3.371-0.314,6.806-0.314,10.234c0,3.5,0.064,6.871,0.314,10.242h40.694 c-0.364-3.371-0.436-6.798-0.436-10.242c0-3.427,0.072-6.862,0.436-10.234H60.152z"/>
												<path class="st1" d="M165.419,82.016c-5.072,2.565-10.016,5.404-14.814,8.517l20.29,35.234l1.492-1.008 c3.846-2.436,7.774-4.734,11.758-6.766l1.557-0.75L165.419,82.016z"/>
												<path class="st1" d="M90.548,150.596c-3.112,4.799-5.952,9.734-8.516,14.807l35.234,20.282l8.524-14.798L90.548,150.596z"/>
												<path class="st1" d="M125.79,340.976l-1.024-1.492c-2.428-3.79-4.726-7.71-6.758-11.766l-0.814-1.548l-35.161,20.282 c2.5,5.073,5.403,10.008,8.516,14.806L125.79,340.976z"/>
												<path class="st1" d="M172.387,387.097l-1.492-1.016l-20.29,35.241c4.798,3.113,9.742,6.016,14.814,8.589l20.283-35.234l-1.557-0.75 C180.161,391.903,176.234,389.605,172.387,387.097z"/>
												<path class="st1" d="M361.282,90.532c-4.798-3.113-9.678-5.952-14.734-8.517l-20.363,35.162l14.806,8.588L361.282,90.532z"/>
												<path class="st1" d="M266.209,100.838V60.201c-3.371-0.306-6.798-0.371-10.242-0.371c-3.428,0-6.855,0.064-10.234,0.371v40.637 v0.428h20.476V100.838z"/>
												<path class="st1" d="M386.064,170.863l7.847,13.541l0.742,1.322l0.25-0.169l35.016-20.145c-2.564-5.121-5.451-9.992-8.588-14.783 L386.064,170.863z"/>
												<path class="st1" d="M448.992,266.072c0.17,0.089,0.17,0.089,0.17,0.169h2.637c0.25-3.386,0.331-6.854,0.331-10.322 c0-3.387-0.081-6.854-0.331-10.161h-25.186c0.331,0.249,0.662,0.58,0.992,0.83L448.992,266.072z"/>
												<path class="st1" d="M256,0C114.54,0,0,114.54,0,256c0,141.379,114.54,255.919,256,256c15.282,0,30.306-1.403,44.847-3.96 c-12.637-7.847-23.782-17.839-33.032-29.403c-3.887,0.249-7.847,0.33-11.815,0.33c-61.686-0.081-117.258-24.935-157.725-65.323 C57.895,373.266,33.032,317.605,33.032,256c0-61.685,24.862-117.266,65.242-157.726C138.741,57.887,194.314,33.032,256,33.032 c61.605,0,117.186,24.855,157.654,65.242c40.378,40.46,65.234,96.04,65.314,157.726c0,14.621-1.484,28.903-4.129,42.693 c9.58,14.952,16.604,30.726,20.975,46.912C506.306,317.685,512,287.548,512,256C511.919,114.54,397.379,0,256,0z"/>
												<path class="st1" d="M412.702,268.621c-19.315-15.452-26.855-32.484-29.759-44.621c-2.33-9.718-1.105-10.774-1.105-10.774 c-0.096-1.153-0.83-2.153-1.879-2.637c-1.064-0.508-2.29-0.396-3.242,0.266c0,0-3.742,0.807-9.838,6.726 c-13.887,13.467-29.573,35.967-19.242,66.701c11.121,32.976,5.234,39.887-0.572,39.444c-7.532-0.589-8.694-5.226-7.492-19.686 c1.403-16.887-13.92-31.323-13.92-31.323s-23.814,37.855-42.371,64.928c-10.968,15.992-16.226,36.338-16.226,54.887h-0.371 c0,57.08,46.266,103.346,103.339,103.346c57.072,0,103.322-46.266,103.322-103.346C477.282,342.976,450.354,298.75,412.702,268.621 z M370.209,466.782c-31.492,0-57.008-25.524-57.008-57.008c0-10.71,2.968-20.75,8.097-29.306 c4.436,16.491,19.484,28.621,37.363,28.621c21.371,0,38.694-17.315,38.694-38.662c0-4.089-0.646-8.024-1.815-11.709 c18.758,9.322,31.661,28.67,31.661,51.056C427.201,441.258,401.693,466.782,370.209,466.782z"/>
										</g>
									</g>
								</svg>
								<span class="css-1sr5vj2-screenReaderContent">Add To Do</span>
							</span>
						</span>
					</span>
				</span>
			</button>
		`;

		const sidebarButton: HTMLElement = utility.convertHtml(sidebarButtonData);

		buttonSibling.after(sidebarButton);

		const announcementButtonData: string = `
			<div class="announcement-button">
				<span tabindex="0" class="${buttonClass} announcement-button">
					<span class="css-1eaecfq-baseButton__content">
						<span class="css-qi8ml9-baseButton__childrenLayout">
							<span class="css-5udsuu-baseButton__iconOnly">
								<span class="css-quqv7u-baseButton__iconSVG">
									<svg viewBox="0 0 1920 1920" width="1em" height="1em">
										<g role="presentation">
											<path d="M1587.162 31.278c11.52-23.491 37.27-35.689 63.473-29.816 25.525 6.099 43.483 28.8 43.483 55.002V570.46C1822.87 596.662 1920 710.733 1920 847.053c0 136.32-97.13 250.503-225.882 276.705v513.883c0 26.202-17.958 49.016-43.483 55.002a57.279 57.279 0 0 1-12.988 1.468c-21.12 0-40.772-11.745-50.485-31.171C1379.238 1247.203 964.18 1242.347 960 1242.347H564.706v564.706h87.755c-11.859-90.127-17.506-247.003 63.473-350.683 52.405-67.087 129.657-101.082 229.948-101.082v112.941c-64.49 0-110.57 18.861-140.837 57.487-68.781 87.868-45.064 263.83-30.269 324.254 4.18 16.828.34 34.673-10.277 48.34-10.73 13.665-27.219 21.684-44.499 21.684H508.235c-31.171 0-56.47-25.186-56.47-56.47v-621.177h-56.47c-155.747 0-282.354-126.607-282.354-282.353v-56.47h-56.47C25.299 903.523 0 878.336 0 847.052c0-31.172 25.299-56.471 56.47-56.471h56.471v-56.47c0-155.634 126.607-282.354 282.353-282.354h564.593c16.941-.112 420.48-7.002 627.275-420.48Zm-5.986 218.429c-194.71 242.371-452.216 298.164-564.705 311.04v572.724c112.489 12.876 369.995 68.556 564.705 311.04ZM903.53 564.7H395.294c-93.402 0-169.412 76.01-169.412 169.411v225.883c0 93.402 76.01 169.412 169.412 169.412H903.53V564.7Zm790.589 123.444v317.93c65.618-23.379 112.94-85.497 112.94-159.021 0-73.525-47.322-135.53-112.94-158.909Z" fill-rule="evenodd">
										</g>
									</svg>
									<span class="css-1sr5vj2-screenReaderContent">Add To Do</span>
								</span>
							</span>
						</span>
					</span>
				</span>
			</div>
		`;

		const announcementButton: HTMLElement = utility.convertHtml(announcementButtonData);

		buttonSibling.before(announcementButton);

		// Add the scroll to today button.
		const scrollButtonData: string = `
			<button type="button" class="css-1mcl61n-view--inlineBlock-baseButton dd-scroll-button">
				<span class="css-p3olqp-baseButton__content css-1f6zcte-baseButton__content css-11xkk0o-baseButton__children">
					Today
				</span>
			</button>
		`;

		const scrollButton: HTMLElement = utility.convertHtml(scrollButtonData);

		scrollButton.addEventListener("click", () => {
			utility.scrollToToday();
		});

		announcementButton.before(scrollButton);

		// We are done adding the header buttons, set the checker.
		this.loadConditions[0] = true;
	}

	addShowMoreButton(node: HTMLElement): void {
		utility.log("Adding show more button.");
		const showMoreButtonData: string = `
			<span class="show-more-button">Show More</span>
		`;

		const showMoreButton: HTMLElement = utility.convertHtml(showMoreButtonData);

		const parent: HTMLElement = node.parentElement!;

		parent.append(showMoreButton);

		showMoreButton.addEventListener("click", this.showMore.bind(this));
	}

	async showMore(): Promise<void> {
		// Change our planning dates and get the new assignments.
		data.backPlan -= 1;
		data.startDate.setDate(data.startDate.getDate() - 7);

		data.planner!.addWeekdaySlots(data.backPlan);

		await data.updateAssignments();

		data.planner!.sidebar.updateUnplannedCount();
		data.planner!.announcements!.getAnnouncements();
		data.planner!.announcements!.updateUnreadCount();
	}

	isNothingPlannedMessage(element: HTMLElement): boolean {
		// Checks if the element is the "Nothing planned today. Selecting next item." message that is useless with
		// our view.
		if (
			this.view === 3 &&
			(element.id === "flashalert_message_holder" ||
				element.querySelector(".css-8v1ycj-view-alert"))
		) {
			const children: HTMLParagraphElement[] = element.querySelectorAll(
				"p"
			) as unknown as HTMLParagraphElement[];
			for (const child of children) {
				if (child.textContent === "Nothing planned today. Selecting next item.") {
					return true;
				}
			}
		}
		return false;
	}

	removeNothingPlanned(node: HTMLElement): void {
		node.style.display = "none";
		utility.log("Hiding nothing planned message.");
	}

	changeView(list: HTMLElement, view: number): void {
		if (this.ignoreViewChange) {
			utility.log("Ignoring view change.");
			// This was triggered by the click event in this function.
			this.ignoreViewChange = false;
			return;
		}
		utility.log(`Changing view to ${view}.`);
		this.view = view;
		utility.saveStorage("view", view.toString());

		this.setViewClass();

		// Hide the list
		if (this.view === 3) {
			// It's not technically a button, but it has a click listener.
			const listView: HTMLButtonElement = list.children[1].children[0] as HTMLButtonElement;
			this.ignoreViewChange = true; // This sets it so that the click event doesn't trigger the changeView function.
			listView.click();
		}
	}
}
