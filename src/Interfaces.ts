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

interface AssignmentExtraJson {
	id: number;
	name: string;
	has_submitted_submissions: boolean;
	due_at: string;
	unlock_at: null | string;
	description: string;
	submission_types: string[];
	allowed_extensions: string[];
	points_possible: number;
	quiz_id?: number;
	discussion_topic?: {
		id: number;
		title: never;
		last_reply_at: never;
		created_at: never;
		delayed_post_at: never;
		posted_at: never;
		assignment_id: never;
		root_topic_id: never;
		position: never;
		podcast_has_student_posts: never;
		discussion_type: never;
		lock_at: never;
		allow_rating: never;
		only_graders_can_rate: never;
		sort_by_rating: never;
		is_section_specific: never;
		anonymous_state: never;
		user_name: never;
		discussion_subentry_count: never;
		permissions: never;
		require_initial_post: never;
		user_can_see_posts: never;
		podcast_url: never;
		read_state: never;
		unread_count: never;
		subscribed: never;
		attachments: never;
		published: never;
		can_unpublish: never;
		locked: never;
		can_lock: never;
		comments_disabled: never;
	};
	allowed_attempts: never;
	annotatable_attachment_id: never;
	anonymize_students: never;
	anonymous_grading: never;
	anonymous_instructor_annotations: never;
	anonymous_peer_reviews: never;
	assignment_group_id: never;
	automatic_peer_reviews: never;
	can_duplicate: never;
	course_id: never;
	created_at: never;
	due_date_required: never;
	final_grader_id: never;
	free_form_criterion_comments: never;
	grade_group_students_individually: never;
	graded_submissions_exist: never;
	grader_comments_visible_to_graders: never;
	grader_count: never;
	grader_names_visible_to_final_grader: never;
	graders_anonymous_to_graders: never;
	grading_standard_id: never;
	grading_type: never;
	group_category_id: never;
	hide_in_gradebook: never;
	html_url: never;
	important_dates: never;
	in_closed_grading_period: never;
	intra_group_peer_reviews: never;
	is_quiz_assignment: never;
	lock_at: never;
	locked_for_user: never;
	lti_context_id: never;
	max_name_length: never;
	moderated_grading: never;
	muted: never;
	omit_from_final_grade: never;
	only_visible_to_overrides: never;
	original_assignment_id: never;
	original_assignment_name: never;
	original_course_id: never;
	original_lti_resource_link_id: never;
	original_quiz_id: never;
	peer_reviews: never;
	position: never;
	post_manually: never;
	post_to_sis: never;
	published: never;
	require_lockdown_browser: never;
	restrict_quantitative_data: never;
	rubric: never;
	rubric_settings: never;
	secure_params: never;
	submissions_download_url: never;
	updated_at: never;
	use_rubric_for_grading: never;
	workflow_state: never;
}

interface LocalCourseJson {
	localStorage: never;
	id: number;
	name: string;
	code: string;
	assignments: LocalAssignmentJson[];
	utility: never;
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
	lock: boolean; // Lock to due date if it's time is unchangeable.
	planned: boolean;
	basic_estimate: number | null;
	history_estimate: number | null;
	user_estimate: number | null;
	time_taken: number | null; // Time taken to complete the assignment
	// Data added by addExtraData in Course
	description?: string;
	submission_types?: string[];
}

interface HtmlElement {
	element: string;
	attributes?: { [key: string]: string };
	textContent?: string;
	innerHTML?: string;
	href?: string;
	children?: HtmlElement[];
}

interface SettingsJson {
	useBasicEstimate: boolean;
	useHistoryEstimate: boolean;
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
	[date: string]: PlanItem[];
}

interface PlanItem {
	id: number;
	due_date: Date;
}
