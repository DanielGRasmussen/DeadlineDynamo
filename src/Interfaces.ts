interface CourseJson {
	id: number;
	name: string;
	course_code: string;
	account_id: never;
	apply_assignment_group_weights: never;
	blueprint: never;
	calendar: never;
	course_color: never;
	course_format: never;
	created_at: never;
	default_view: never;
	end_at: never;
	enrollment_term_id: never;
	enrollments: never;
	friendly_name: never;
	grade_passback_setting: never;
	grading_standard_id: never;
	hide_final_grades: never;
	homeroom_course: never;
	is_public: never;
	is_public_to_auth_users: never;
	license: never;
	locale: never;
	public_syllabus: never;
	public_syllabus_to_auth: never;
	restrict_enrollments_to_course_dates: never;
	root_account_id: never;
	start_at: never;
	storage_quota_mb: never;
	template: never;
	time_zone: never;
	uuid: never;
	workflow_state: never;
}

interface AssignmentJson {
	id: number;
	name: string;
	has_submitted_submissions: boolean;
	due_at: string;
	unlock_at: null | string;
	description: string;
	submission_types: string[];
	allowed_extensions: string[];
	points_possible: number;
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
}

interface LocalAssignmentJson {
	percComplete: number;
	id: number;
	courseId: number;
	name: string;
	submitted: boolean;
	dueDate: string;
	unlockAt: string;
	description: string;
	lock: boolean;
	submissionTypes: string[];
	allowedExtensions: string[];
	pointsPossible: number;
	link: string;
	planned: boolean;
	basicEstimate: number | null;
	historyEstimate: number | null;
	userEstimate: number | null;
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
