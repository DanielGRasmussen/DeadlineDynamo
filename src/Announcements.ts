class Announcements {
	utility: Utility = data.utility;
	courses: Course[] = data.courses;
	announcements!: Assignment[];
	announcements_open: boolean = false;
	handleClickOutsideListener: (event: MouseEvent) => void;

	constructor() {
		this.handleClickOutsideListener = this.handleClickOutside.bind(this);

		const announcement_button: Element | null = document.querySelector(".announcement-button");

		if (announcement_button === null) {
			this.utility.notify("error", "Announcement button not found.");
			return;
		}

		announcement_button.addEventListener("click", (): void => {
			if (!this.announcements_open) {
				this.getAnnouncements();
				this.createAnnouncements(announcement_button);
				this.markAllAsRead();
				this.updateUnreadCount(announcement_button, 0);

				this.enableClickOutsideListener();
			} else {
				this.removeAnnouncements();
			}
		});

		// We have to have the unread count off the bat.
		this.getAnnouncements();
		this.addUnreadCount(announcement_button);
	}

	getAnnouncements(): void {
		// Get list of announcements
		const announcements: Assignment[] = this.courses
			.flatMap((course: Course): Assignment[] => course.assignments)
			.filter((assignment: Assignment): boolean => {
				if (assignment.type !== "announcement") {
					return false;
				} else if (assignment.due_date < data.startDate) {
					return false;
				}

				return true;
			});

		// Sort the announcements by date.
		this.announcements = announcements.sort((a: Assignment, b: Assignment): number => {
			if (a.due_date < b.due_date) {
				return 1;
			}
			if (a.due_date > b.due_date) {
				return -1;
			}
			return 0;
		});
	}

	createAnnouncements(button: Element): void {
		// Create the container for the announcements.
		const container: HTMLElement = this.utility.convertHtml(`
			<div class="announcement-container">
				<h4>Announcements</h4>
			</div>
		`);

		// Add the announcements to the container.
		for (const announcement of this.announcements) {
			const course: Course | undefined = this.courses.find((course: Course): boolean => {
				return course.id === announcement.course_id;
			});

			if (course === undefined) {
				this.utility.notify("error", "Course not found.");
				return;
			}

			const announcementDate: string[] = this.utility.formatDate(announcement.due_date, true);

			const link: string = `/courses/${announcement.course_id}/discussion_topics/${announcement.id}`;

			const announcement_element: HTMLElement = this.utility.convertHtml(`
				<div class="announcement">
					<a target="_blank" title="${announcement.name}" href="${link}">${announcement.name}</a>
					<p class="course">${course.code}</p>
					<p class="date">${announcementDate[0]} ${announcementDate[1]}</p>
				</div>
			`);

			container.appendChild(announcement_element);
		}

		// Add the container to the announcement button.
		button.after(container);

		this.announcements_open = true;
	}

	removeAnnouncements(): void {
		const container: HTMLElement | null = document.querySelector(".announcement-container");

		if (container === null) {
			this.utility.notify("error", "Announcement container not found.");
			return;
		}

		container.remove();

		this.announcements_open = false;
		this.disableClickOutsideListener();
	}

	handleClickOutside(event: MouseEvent): void {
		const button: HTMLElement | null = document.querySelector(".announcement-button");
		const container: HTMLElement | null = document.querySelector(".announcement-container");

		if (
			button &&
			!button.contains(event.target as Node) &&
			container &&
			!container.contains(event.target as Node)
		) {
			this.removeAnnouncements();
		}
	}

	enableClickOutsideListener(): void {
		document.addEventListener("click", this.handleClickOutsideListener);
	}

	disableClickOutsideListener(): void {
		document.removeEventListener("click", this.handleClickOutsideListener);
	}

	updateUnreadCount(button?: Element | null, unread: number = -1): void {
		if (button === undefined) {
			button = document.querySelector(".announcement-button");

			if (button === null) {
				this.utility.notify("error", "Announcement button not found.");
				return;
			}
		}

		button!.querySelector(".count")?.remove();

		this.addUnreadCount(button!, unread);
	}

	addUnreadCount(button: Element, unread: number = -1): void {
		if (unread === -1) {
			unread = this.announcements.filter((announcement: Assignment): boolean => {
				return !announcement.read;
			}).length;
		}

		if (unread !== 0) {
			// If it is greater than 9, just display 9+.
			let unreadText: string = unread.toString();
			if (unread > 9) {
				unreadText = "9+";
			}

			button.addEventListener("click", this.markAllAsRead.bind(this));

			// Display unread count to the user.
			const unreadElement: HTMLElement = this.utility.convertHtml(`
				<p class="count">${unreadText}</p>
			`);

			button.firstChild!.before(unreadElement);
		}
	}

	markAllAsRead(): void {
		for (const announcement of this.announcements) {
			announcement.read = true;
		}
	}
}
