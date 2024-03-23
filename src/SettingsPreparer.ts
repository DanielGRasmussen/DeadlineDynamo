class SettingsPreparer {
	utility: Utility = new Utility();
	link: string = "/deadline-dynamo";
	observer: MutationObserver = new MutationObserver(this.listener.bind(this));
	insertedSidebarLink: boolean = false;
	titleHeaderChanged: boolean = false;
	removedNotFound: boolean = false;
	addedHeader: boolean = false;

	constructor() {
		this.observer.observe(document, { childList: true, subtree: true });
	}

	// Prepare the settings page.
	listener(mutationsList: MutationRecord[]): void {
		// The goal of this is to catch any changes that we don't like and remove them or use them as a reference to
		// make our own changes.
		// This is to make sure that the changes don't appear for a split second before we remove them.
		for (const mutation of mutationsList) {
			// We only need to check for added nodes.
			if (mutation.type !== "childList") {
				continue;
			}

			mutation.addedNodes.forEach(node => {
				if (!(node instanceof HTMLElement)) {
					return;
				}
				const parent: HTMLElement | null = node.parentElement;

				// Add the sidebar link after the courses link has been added.
				if (node.id === "global_nav_courses_link") {
					this.insertSidebarLink();
					this.insertedSidebarLink = true;
				} else if (
					node.classList.contains("css-rstbmp-view--block") &&
					node.tagName === "SPAN" &&
					node.querySelector("ul.css-vftc6n-view--block-list")
				) {
					// This is added and removed repeatedly, so it has to be checked for every time it is added.
					this.utility.log("Adding mini nav button.");
					this.addMiniNavButton(node);
				}
				if (window.location.pathname.startsWith(this.link)) {
					// The rest of the changes should only occur on the settings page.
					// Set the title and fix the mobile header.
					if (node.classList && node.classList.contains("mobile-header-title")) {
						node.innerHTML = "Deadline Dynamo Settings";
						document.title = "Deadline Dynamo Settings";
						this.titleHeaderChanged = true;
					}

					// Remove the "Page not found" message & svg.
					else if (
						parent &&
						parent.id === "content" &&
						node.id !== "byui-copyright" &&
						// Either no classes or not the settings wrapper.
						(!node.classList || !node.classList.contains("settings-wrapper"))
					) {
						node.remove();

						// Removed the div and all its content, but we need the div.
						this.addContainer();

						this.removedNotFound = true;
					}

					// Add our header to the settings page.
					else if (node.id === "main") {
						this.addHeader();
						this.addedHeader = true;
					}
				}
			});
		}
	}

	insertSidebarLink(): void {
		// Creates the link to /deadline-dynamo in the left sidebar.
		// Create the element to insert.
		let aria_current: string = "false";
		let icon_fill: string = "#fff";
		let class_list: string = "menu-item ic-app-header__menu-list-item deadline-dynamo-link";
		if (window.location.pathname.startsWith(this.link)) {
			aria_current = "page";
			icon_fill = "#0076b6";
			class_list += " active";
		}

		const sidebarElementData: string = `
			<li class="${class_list}" aria-current="${aria_current}">
				<a id="deadline_dynamo_link" role="button" class="ic-app-header__menu-list-link" href="${this.link}">
					<div class="menu-item-icon-container" aria-hidden="true">
						<svg height="200px" width="200px" id="_x32_" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xml:space="preserve" fill="#ffffff" stroke="#ffffff">
							<g id="SVGRepo_iconCarrier">
								<style type="text/css">
									.st0{fill:${icon_fill};}
								</style>
								<g>
									<path class="st0" d="M190.5,213.96c-3.887,5.298-3.314,12.346,1.299,15.726l55.58,42.879l0.774,0.444l0.347,0.193 c4.806,2.677,11.17,1.258,15.411-3.412l0.371-0.354l68.121-80.597c3.879-4.347,3.944-10.605,0.17-13.96 c-3.782-3.363-9.984-2.556-13.847,1.79l-63.678,68.024l-49.161-34.235C201.29,207.073,194.395,208.645,190.5,213.96z"/>
									<path class="st0" d="M60.152,245.726c-0.249,3.371-0.314,6.806-0.314,10.234c0,3.5,0.064,6.871,0.314,10.242h40.694 c-0.364-3.371-0.436-6.798-0.436-10.242c0-3.427,0.072-6.862,0.436-10.234H60.152z"/>
									<path class="st0" d="M165.419,82.016c-5.072,2.565-10.016,5.404-14.814,8.517l20.29,35.234l1.492-1.008 c3.846-2.436,7.774-4.734,11.758-6.766l1.557-0.75L165.419,82.016z"/>
									<path class="st0" d="M90.548,150.596c-3.112,4.799-5.952,9.734-8.516,14.807l35.234,20.282l8.524-14.798L90.548,150.596z"/>
									<path class="st0" d="M125.79,340.976l-1.024-1.492c-2.428-3.79-4.726-7.71-6.758-11.766l-0.814-1.548l-35.161,20.282 c2.5,5.073,5.403,10.008,8.516,14.806L125.79,340.976z"/>
									<path class="st0" d="M172.387,387.097l-1.492-1.016l-20.29,35.241c4.798,3.113,9.742,6.016,14.814,8.589l20.283-35.234l-1.557-0.75 C180.161,391.903,176.234,389.605,172.387,387.097z"/>
									<path class="st0" d="M361.282,90.532c-4.798-3.113-9.678-5.952-14.734-8.517l-20.363,35.162l14.806,8.588L361.282,90.532z"/>
									<path class="st0" d="M266.209,100.838V60.201c-3.371-0.306-6.798-0.371-10.242-0.371c-3.428,0-6.855,0.064-10.234,0.371v40.637 v0.428h20.476V100.838z"/>
									<path class="st0" d="M386.064,170.863l7.847,13.541l0.742,1.322l0.25-0.169l35.016-20.145c-2.564-5.121-5.451-9.992-8.588-14.783 L386.064,170.863z"/>
									<path class="st0" d="M448.992,266.072c0.17,0.089,0.17,0.089,0.17,0.169h2.637c0.25-3.386,0.331-6.854,0.331-10.322 c0-3.387-0.081-6.854-0.331-10.161h-25.186c0.331,0.249,0.662,0.58,0.992,0.83L448.992,266.072z"/>
									<path class="st0" d="M256,0C114.54,0,0,114.54,0,256c0,141.379,114.54,255.919,256,256c15.282,0,30.306-1.403,44.847-3.96 c-12.637-7.847-23.782-17.839-33.032-29.403c-3.887,0.249-7.847,0.33-11.815,0.33c-61.686-0.081-117.258-24.935-157.725-65.323 C57.895,373.266,33.032,317.605,33.032,256c0-61.685,24.862-117.266,65.242-157.726C138.741,57.887,194.314,33.032,256,33.032 c61.605,0,117.186,24.855,157.654,65.242c40.378,40.46,65.234,96.04,65.314,157.726c0,14.621-1.484,28.903-4.129,42.693 c9.58,14.952,16.604,30.726,20.975,46.912C506.306,317.685,512,287.548,512,256C511.919,114.54,397.379,0,256,0z"/>
									<path class="st0" d="M412.702,268.621c-19.315-15.452-26.855-32.484-29.759-44.621c-2.33-9.718-1.105-10.774-1.105-10.774 c-0.096-1.153-0.83-2.153-1.879-2.637c-1.064-0.508-2.29-0.396-3.242,0.266c0,0-3.742,0.807-9.838,6.726 c-13.887,13.467-29.573,35.967-19.242,66.701c11.121,32.976,5.234,39.887-0.572,39.444c-7.532-0.589-8.694-5.226-7.492-19.686 c1.403-16.887-13.92-31.323-13.92-31.323s-23.814,37.855-42.371,64.928c-10.968,15.992-16.226,36.338-16.226,54.887h-0.371 c0,57.08,46.266,103.346,103.339,103.346c57.072,0,103.322-46.266,103.322-103.346C477.282,342.976,450.354,298.75,412.702,268.621 z M370.209,466.782c-31.492,0-57.008-25.524-57.008-57.008c0-10.71,2.968-20.75,8.097-29.306 c4.436,16.491,19.484,28.621,37.363,28.621c21.371,0,38.694-17.315,38.694-38.662c0-4.089-0.646-8.024-1.815-11.709 c18.758,9.322,31.661,28.67,31.661,51.056C427.201,441.258,401.693,466.782,370.209,466.782z"/>
								</g>
							</g>
						</svg>
					</div>
					<div class="menu-item__text">Deadline Dynamo</div>
				</a>
			</li>
		`;

		const sidebarElement: HTMLElement = this.utility.createHtmlFromJson(sidebarElementData);

		// Find the list of links on the sidebar.
		const target: HTMLElement | null = document.querySelector(
			"li:has(#global_nav_courses_link)"
		);

		if (target === null) {
			this.utility.alerter("Error: Couldn't find the target.");
			return;
		}
		target.after(sidebarElement);
	}

	addMiniNavButton(parent: Element): void {
		const navList: Element = parent.children[1];

		const navButtonData: string = `
			<li class="css-i3c1s5-view-listItem">
				<a class="css-al447q-view--block-link" href="/deadline-dynamo">
					<span class="css-10d73cs-view--flex-flex">
						<span class="css-w1drs0-view-flexItem deadline-dynamo-mininav-icon">
							<svg height="32px" width="32px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xml:space="preserve" fill="rgb(0, 118, 182)" stroke="rgb(0, 118, 182)">
								<g>
									<style type="text/css">
										.deadline-dynamo-mininav-icon svg{margin-top:3px;}
										.st2{fill:rgb(0, 118, 182);}
										li.css-i3c1s5-view-listItem a:hover svg .st2{fill:rgb(0, 85, 131)}
									</style>
									<g>
										<path class="st2" d="M190.5,213.96c-3.887,5.298-3.314,12.346,1.299,15.726l55.58,42.879l0.774,0.444l0.347,0.193 c4.806,2.677,11.17,1.258,15.411-3.412l0.371-0.354l68.121-80.597c3.879-4.347,3.944-10.605,0.17-13.96 c-3.782-3.363-9.984-2.556-13.847,1.79l-63.678,68.024l-49.161-34.235C201.29,207.073,194.395,208.645,190.5,213.96z"/>
										<path class="st2" d="M60.152,245.726c-0.249,3.371-0.314,6.806-0.314,10.234c0,3.5,0.064,6.871,0.314,10.242h40.694 c-0.364-3.371-0.436-6.798-0.436-10.242c0-3.427,0.072-6.862,0.436-10.234H60.152z"/>
										<path class="st2" d="M165.419,82.016c-5.072,2.565-10.016,5.404-14.814,8.517l20.29,35.234l1.492-1.008 c3.846-2.436,7.774-4.734,11.758-6.766l1.557-0.75L165.419,82.016z"/>
										<path class="st2" d="M90.548,150.596c-3.112,4.799-5.952,9.734-8.516,14.807l35.234,20.282l8.524-14.798L90.548,150.596z"/>
										<path class="st2" d="M125.79,340.976l-1.024-1.492c-2.428-3.79-4.726-7.71-6.758-11.766l-0.814-1.548l-35.161,20.282 c2.5,5.073,5.403,10.008,8.516,14.806L125.79,340.976z"/>
										<path class="st2" d="M172.387,387.097l-1.492-1.016l-20.29,35.241c4.798,3.113,9.742,6.016,14.814,8.589l20.283-35.234l-1.557-0.75 C180.161,391.903,176.234,389.605,172.387,387.097z"/>
										<path class="st2" d="M361.282,90.532c-4.798-3.113-9.678-5.952-14.734-8.517l-20.363,35.162l14.806,8.588L361.282,90.532z"/>
										<path class="st2" d="M266.209,100.838V60.201c-3.371-0.306-6.798-0.371-10.242-0.371c-3.428,0-6.855,0.064-10.234,0.371v40.637 v0.428h20.476V100.838z"/>
										<path class="st2" d="M386.064,170.863l7.847,13.541l0.742,1.322l0.25-0.169l35.016-20.145c-2.564-5.121-5.451-9.992-8.588-14.783 L386.064,170.863z"/>
										<path class="st2" d="M448.992,266.072c0.17,0.089,0.17,0.089,0.17,0.169h2.637c0.25-3.386,0.331-6.854,0.331-10.322 c0-3.387-0.081-6.854-0.331-10.161h-25.186c0.331,0.249,0.662,0.58,0.992,0.83L448.992,266.072z"/>
										<path class="st2" d="M256,0C114.54,0,0,114.54,0,256c0,141.379,114.54,255.919,256,256c15.282,0,30.306-1.403,44.847-3.96 c-12.637-7.847-23.782-17.839-33.032-29.403c-3.887,0.249-7.847,0.33-11.815,0.33c-61.686-0.081-117.258-24.935-157.725-65.323 C57.895,373.266,33.032,317.605,33.032,256c0-61.685,24.862-117.266,65.242-157.726C138.741,57.887,194.314,33.032,256,33.032 c61.605,0,117.186,24.855,157.654,65.242c40.378,40.46,65.234,96.04,65.314,157.726c0,14.621-1.484,28.903-4.129,42.693 c9.58,14.952,16.604,30.726,20.975,46.912C506.306,317.685,512,287.548,512,256C511.919,114.54,397.379,0,256,0z"/>
										<path class="st2" d="M412.702,268.621c-19.315-15.452-26.855-32.484-29.759-44.621c-2.33-9.718-1.105-10.774-1.105-10.774 c-0.096-1.153-0.83-2.153-1.879-2.637c-1.064-0.508-2.29-0.396-3.242,0.266c0,0-3.742,0.807-9.838,6.726 c-13.887,13.467-29.573,35.967-19.242,66.701c11.121,32.976,5.234,39.887-0.572,39.444c-7.532-0.589-8.694-5.226-7.492-19.686 c1.403-16.887-13.92-31.323-13.92-31.323s-23.814,37.855-42.371,64.928c-10.968,15.992-16.226,36.338-16.226,54.887h-0.371 c0,57.08,46.266,103.346,103.339,103.346c57.072,0,103.322-46.266,103.322-103.346C477.282,342.976,450.354,298.75,412.702,268.621 z M370.209,466.782c-31.492,0-57.008-25.524-57.008-57.008c0-10.71,2.968-20.75,8.097-29.306 c4.436,16.491,19.484,28.621,37.363,28.621c21.371,0,38.694-17.315,38.694-38.662c0-4.089-0.646-8.024-1.815-11.709 c18.758,9.322,31.661,28.67,31.661,51.056C427.201,441.258,401.693,466.782,370.209,466.782z"/>
									</g>
								</g>
							</svg>
						</span>
						<span class="css-oowy02-view-flexItem">
							<span class="css-1vfp3rz-text">Deadline Dynamo</span>
						</span>
					</span>
				</a>
			</li>
		`;

		const navButton: HTMLElement = this.utility.createHtmlFromJson(navButtonData);

		navList.children[2].after(navButton);
	}

	addHeader(): void {
		// Adds our header to the settings page.
		const headerData: string = `
			<div class="ic-app-nav-toggle-and-crumbs no-print">
				<button id="courseMenuToggle" class="Button Button--link ic-app-nav-toggle">
					<i class="icon-hamburger" aria-hidden="true"></i>
				</button>
				<div class="ic-app-crumbs">
					<nav id="breadcrumbs" role="navigation" aria-label="breadcrumbs">
						<ul>
							<li class="home">
								<a href="/">
									<span class="ellipsible">
										<i class="icon-home" title="Deadline Dynamo Settings">
											<span class="screenreader-only">Deadline Dynamo Settings</span>
										</i>
									</span>
								</a>
							</li>
							<li>
								<span class="ellipsible">Deadline Dynamo</span>
							</li>
							<li>
								<a href="${this.link}">
									<span class="ellipsible">Settings</span>
								</a>
							</li>
						</ul>
					</nav>
				</div>
			</div>
		`;

		const header: HTMLElement = this.utility.createHtmlFromJson(headerData);

		const nav: HTMLElement = this.createNav();

		// Find the main content area.
		const target: HTMLElement | null = document.querySelector("#main");
		if (target === null) {
			this.utility.alerter("Error: Couldn't find the target.");
			return;
		}

		target.insertBefore(nav, target.firstChild);
		target.before(header);
	}

	createNav(): HTMLElement {
		const navData: string = `
			<div id="left-side" class="ic-app-course-menu ic-sticky-on list-view">
				<div id="sticky-container" class="ic-sticky-frame">
					<nav>
						<ul id="section-tabs"></ul>
					</nav>
				</div>
			</div>
		`;

		const nav: HTMLElement = this.utility.createHtmlFromJson(navData);
		const list: HTMLUListElement = nav.querySelector("ul")!;

		const links: string[][] = [
			["", "Main"],
			["estimates-planning", "Estimating & Planning"]
		];

		for (const link of links) {
			const listItemData: string = `
				<li class="section">
					<a href="${this.link}/${link[0]}">${link[1]}</a>
				</li>
			`;

			const listItem: HTMLElement = this.utility.createHtmlFromJson(listItemData);

			list.appendChild(listItem);
		}

		return nav;
	}

	addContainer(): void {
		// Container for the list of items
		const containerData: string = `
			<div class="settings-wrapper"></div>
		`;
		const container: HTMLElement = this.utility.createHtmlFromJson(containerData);

		const target: Element | null = document.querySelector("#content");
		if (target === null) {
			this.utility.alerter("Error: Couldn't find the target.");
			return;
		}
		target.insertBefore(container, target.firstChild);
	}
}

new SettingsPreparer();
