interface CourseJson {
	id: number;
	longName: string;
	shortName: string;
	courseCode: string;
	href: string;
	term: string;
	subtitle: string;
	enrollmentState: string;
	enrollmentType: string;
	originalName: never;
	assetString: never;
	observee: never;
	isFavorited: never;
	isK5Subject: never;
	isHomeroom: never;
	useClassicFont: never;
	canManage: never;
	canReadAnnouncements: never;
	image: never;
	color: never;
	position: never;
	published: never;
	links: never;
	canChangeCoursePublishState: never;
	defaultView: never;
	pagesUrl: never;
	frontPageTitle: never;
}

type PlanableType = "announcement" | "assignment" | "calendar_event" | "discussion_topic" | "quiz";

interface AssignmentJson {
	course_id: number;
	submissions: {
		submitted: boolean;
		excused: never;
		graded: never;
		posted_at: never;
		late: never;
		missing: never;
		needs_grading: never;
		has_feedback: never;
		redo_request: never;
	};
	plannable: {
		id: number;
		title: string;
		due_at: string;
		end_at: string;
		location_name?: string;
		points_possible: number | null;
		start_at: string;
		created_at: never;
		updated_at: never;
	};
	plannable_type: PlanableType;
	context_image: never;
	context_name: never;
	context_type: never;
	html_url: never;
	new_activity: never;
	plannable_date: never;
	plannable_id: never;
	planner_override: never;
}

interface LocalCourseJson {
	localStorage: never;
	id: number;
	name: string;
	code: string;
	assignments: LocalAssignmentJson[];
}

interface LocalAssignmentJson {
	id: number;
	course_id: number;
	name: string;
	type: PlanableType;
	submitted: boolean;
	due_date: Date;
	start_date: Date | null;
	end_date: Date | null;
	points_possible: number;
	location_name: string;
	link: string;
	lock: boolean; // Lock to due date if it's time is unchangeable.
	planned: boolean;
	basic_estimate: number | null;
	history_estimate: number | null;
	user_estimate: number | null;
}

interface HtmlElement {
	element: string;
	attributes?: { [key: string]: string };
	textContent?: string;
	innerHTML?: string;
	children?: HtmlElement[];
}

interface SettingsJson {
	prioritizePoorGrades: boolean;
	workHours: WorkHours;
	estimateMultiplier: EstimateMultiplier;
	planDistance: number;
	showEvents: boolean;
}

interface WorkHours {
	[day: string]: number;
}

interface EstimateMultiplier {
	[courseId: string]: number;
}

interface Plan {
	// Date = "YYYY-MM-DD"
	[date: string]: Assignment[];
}

{}{}{}
