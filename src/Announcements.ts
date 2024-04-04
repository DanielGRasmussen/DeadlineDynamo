class Announcements {
	utility: Utility = data.utility;
	courses: Course[] = data.courses;
	announcements!: Assignment[];

	constructor() {
		this.getAnnouncements();
		this.createAnnouncements();
	}

	getAnnouncements(): void {
		// Get list of announcements
		const announcements: Assignment[] = this.courses
			.flatMap((course: Course): Assignment[] => course.assignments)
			.filter((assignment: Assignment): boolean => {
				if (assignment.type !== "announcement") {
					return false;
				} else if (assignment.due_date < this.utility.getMonday(new Date())) {
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

	createAnnouncements(): void {
		// Adds the announcements to the container

		// Check if our announcement button is there. It should be.
		const announcement_container: Element | null = document.querySelector(
			".announcement-button > .announcement-container"
		);

		if (announcement_container === null) {
			this.utility.notify("error", "Announcement button not found.");
			return;
		}

		// To display the number of unread announcements.
		let unread: number = 0;

		// Add the announcements to the container
		for (const announcement of this.announcements) {
			// Get course name
			const course: Course | undefined = this.courses.find((course: Course): boolean => {
				return course.id === announcement.course_id;
			});

			if (course === undefined) {
				this.utility.notify("error", "Course not found.");
				return;
			}

			if (!announcement.read) {
				unread++;
			}

			const announcementDate: string[] = this.utility.formatDate(announcement.due_date, true);

			const link: string = `/courses/${announcement.course_id}/discussion_topics/${announcement.id}`;

			const announcementData: string = `
				<div class="announcement">
					<a target="_blank" title="${announcement.name}" href="${link}">${announcement.name}</a>
					<p class="course">${course.code}</p>
					<p class="date">${announcementDate[0]} ${announcementDate[1]}</p>
				</div>
			`;

			const announcementDiv: HTMLElement = this.utility.convertHtml(announcementData);
			announcement_container.appendChild(announcementDiv);
		}

		// Whenever the button is clicked mark all announcements as read.
		if (unread !== 0) {
			// If it is greater than 9, just display 9+.
			let unreadText: string = unread.toString();
			if (unread > 9) {
				unreadText = "9+";
			}

			const button: HTMLElement = announcement_container.parentElement!;

			button.addEventListener("click", this.markAllAsRead.bind(this, button));

			// Display unread count to the user.
			const unreadElement: HTMLElement = this.utility.convertHtml(`
				<p class="count">${unreadText}</p>
			`);

			button.firstChild!.before(unreadElement);
		}
	}

	markAllAsRead(button: HTMLElement): void {
		for (const announcement of this.announcements) {
			announcement.read = true;
		}

		button.querySelector(".count")?.remove();

		// Save the courses now.
		for (const course of this.courses) {
			course.saveCourse();
		}
	}
}
