// import { ApiFetcher } from './ApiFetch';
// import { Assignment } from './Assignment';
// import { Course } from './Course';
// import { Estimator } from './Estimator';
// import { LocalStorage } from './LocalStorage';

class Main {
	courses?: Course[];
	apiFetcher: ApiFetcher = new ApiFetcher();
	localStorage: LocalStorage = new LocalStorage();

	constructor() {
		this.Main();
	}

	async Main(): Promise<void> {
		const first: boolean = await this.getCourses();

		if (this.courses === undefined) {
			this.alerter("Fatal Error: No courses found!");
			return;
		}

		if (first) {
			await this.updateAssignments();
		}
	}

	async getCourses(): Promise<boolean> {
		const courseIds: string | null = await this.localStorage.loadStorage("courseIds");

		if (courseIds !== null) {
			// Load stuff from local storage.
			console.log("Stuff was saved!");
			const ids: string[] = JSON.parse(courseIds);
			const courses: Course[] = [];

			let courseData: string | null;
			let courseJson: LocalCourseJson;
			let course: Course;
			for (const id of ids) {
				courseData = await this.localStorage.loadStorage(id);

				if (courseData === null) {
					// If the course data is null, get everything from scratch.
					// The main way this would occur would be if it is a new semester.
					// It could also occur if the user drops a course though.
					// TODO: Fix for if the user drops a course so it doesn't reset all their plans.
					console.log("Course data was null.");
					await this.apiFetcher.makeCourses();
					this.courses = this.apiFetcher.courses;
					return false;
				}

				courseJson = JSON.parse(courseData);
				course = new Course(
					courseJson.id,
					courseJson.name,
					courseJson.code,
					[], // Empty assignments so it knows to use the local format for assignments.
					courseJson.assignments
				);
				courses.push(course);
			}
			this.courses = courses;
			return true;
		} else {
			// First time loading up, therefore we need to get everything from scratch.
			console.log("Stuff wasn't saved.");
			await this.apiFetcher.makeCourses();
			this.courses = this.apiFetcher.courses;

			for (const course of this.courses) {
				await course.saveCourse();
			}
			return false;
		}
	}

	async updateAssignments(): Promise<void> {
		if (this.courses === undefined) {
			this.alerter("Fatal Error: Courses not loaded!");
			return;
		}

		for (const course of this.courses) {
			const assignments: AssignmentJson[] = await this.apiFetcher.fetchAssignments(course.id);

			let currentAssignment: Assignment | undefined;
			let dueDate: string;
			let unlockDate: string;
			for (const assignment of assignments) {
				currentAssignment = course.assignments.find(item => item.id === assignment.id);
				if (currentAssignment === undefined) {
					this.alerter(`New assignment in ${course.name}: ${assignment.name}`);
				} else {
					// .toISOString() returns a string with .000 unlike the API.
					dueDate = currentAssignment.dueDate.toISOString();
					dueDate = dueDate.substring(0, dueDate.length - 5) + "Z";
					if (dueDate !== assignment.due_at) {
						this.alerter(
							`Due date changed for ${currentAssignment.name} in ${course.name}`
						);
					}
					if (currentAssignment.unlockAt) {
						unlockDate = currentAssignment.unlockAt.toISOString();
						unlockDate = unlockDate.substring(0, unlockDate.length - 5) + "Z";
						if (unlockDate !== assignment.unlock_at) {
							this.alerter(
								`Unlock date changed for ${currentAssignment.name} in ${course.name}`
							);
						}
					}
				}
			}

			course.makeAssignments(assignments, []);
		}
	}

	alerter(message: string): void {
		// TODO: Make it much more smooth lol.
		console.log(message);
	}
}

new Main();
