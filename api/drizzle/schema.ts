import { pgTable, index, text, timestamp, foreignKey, unique, boolean, integer, uniqueIndex, jsonb, date, time } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	role: text().default('student').notNull(),
	studentId: text("student_id"),
	teacherId: text("teacher_id"),
	school: text(),
	study: text(),
	phoneNumber: text("phone_number"),
	studentClass: text("student_class"),
	mustChangePassword: boolean("must_change_password").default(true).notNull(),
	subjects: text().array(),
	mentorClassName: text("mentor_class_name"),
	mentorSchoolYear: text("mentor_school_year"),
	schoolYear: text("school_year"),
	studyHistory: text("study_history"),
}, (table) => [
	unique("user_email_unique").on(table.email),
	unique("user_student_id_unique").on(table.studentId),
]);

export const motivationMessages = pgTable("motivation_messages", {
	id: text().primaryKey().notNull(),
	message: text().notNull(),
	active: boolean().default(true).notNull(),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const tasks = pgTable("tasks", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	deadline: timestamp({ mode: 'string' }),
	status: text().default('ONGOING').notNull(),
	priority: text().default('MEDIUM').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	courseId: text("course_id"),
	assignedByTeacherId: text("assigned_by_teacher_id"),
	assignedClassName: text("assigned_class_name"),
	assignmentGroupId: text("assignment_group_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "tasks_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "tasks_course_id_courses_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedByTeacherId],
			foreignColumns: [user.id],
			name: "tasks_assigned_by_teacher_id_user_id_fk"
		}).onDelete("set null"),
]);

export const exercises = pgTable("exercises", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	duration: integer().notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "exercises_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	message: text().notNull(),
	type: text().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "notifications_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const progress = pgTable("progress", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "progress_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "progress_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const lessonItemProgress = pgTable("lesson_item_progress", {
	id: text().primaryKey().notNull(),
	studentId: text("student_id").notNull(),
	itemId: text("item_id").notNull(),
	completed: boolean().default(false).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("lesson_item_progress_student_item_idx").using("btree", table.studentId.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [user.id],
			name: "lesson_item_progress_student_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [lessonItems.id],
			name: "lesson_item_progress_item_id_lesson_items_id_fk"
		}).onDelete("cascade"),
]);

export const stressLevels = pgTable("stress_levels", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	level: integer().notNull(),
	focus: integer().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	sleepHours: integer("sleep_hours"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "stress_levels_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const courses = pgTable("courses", {
	id: text().primaryKey().notNull(),
	creatorId: text("creator_id").notNull(),
	scope: text().notNull(),
	className: text("class_name"),
	title: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [user.id],
			name: "courses_creator_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const lessonProgress = pgTable("lesson_progress", {
	id: text().primaryKey().notNull(),
	studentId: text("student_id").notNull(),
	lessonId: text("lesson_id").notNull(),
	status: text().default('NOT_STARTED').notNull(),
	progressPercent: integer("progress_percent").default(0).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("lesson_progress_student_lesson_idx").using("btree", table.studentId.asc().nullsLast().op("text_ops"), table.lessonId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [user.id],
			name: "lesson_progress_student_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "lesson_progress_lesson_id_lessons_id_fk"
		}).onDelete("cascade"),
]);

export const grades = pgTable("grades", {
	id: text().primaryKey().notNull(),
	studentId: text("student_id").notNull(),
	teacherId: text("teacher_id").notNull(),
	subject: text().notNull(),
	score: integer().notNull(),
	gradedAt: timestamp("graded_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	assessmentName: text("assessment_name"),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [user.id],
			name: "grades_student_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [user.id],
			name: "grades_teacher_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const focusSessions = pgTable("focus_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	durationMinutes: integer("duration_minutes").default(25).notNull(),
	breakType: text("break_type"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "focus_sessions_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "focus_sessions_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const taskChecklistItems = pgTable("task_checklist_items", {
	id: text().primaryKey().notNull(),
	taskId: text("task_id").notNull(),
	title: text().notNull(),
	completed: boolean().default(false).notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_checklist_items_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const lessons = pgTable("lessons", {
	id: text().primaryKey().notNull(),
	courseId: text("course_id").notNull(),
	title: text().notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	chapterId: text("chapter_id"),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "lessons_course_id_courses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "lessons_chapter_id_chapters_id_fk"
		}).onDelete("cascade"),
]);

export const chapters = pgTable("chapters", {
	id: text().primaryKey().notNull(),
	courseId: text("course_id").notNull(),
	title: text().notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "chapters_course_id_courses_id_fk"
		}).onDelete("cascade"),
]);

export const lessonItems = pgTable("lesson_items", {
	id: text().primaryKey().notNull(),
	lessonId: text("lesson_id").notNull(),
	title: text().notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "lesson_items_lesson_id_lessons_id_fk"
		}).onDelete("cascade"),
]);

export const teacherNotes = pgTable("teacher_notes", {
	id: text().primaryKey().notNull(),
	studentId: text("student_id").notNull(),
	teacherId: text("teacher_id").notNull(),
	message: text().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [user.id],
			name: "teacher_notes_student_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [user.id],
			name: "teacher_notes_teacher_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const achievementsUnlocked = pgTable("achievements_unlocked", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	achievementKey: text("achievement_key").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("achievements_unlocked_user_key_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.achievementKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "achievements_unlocked_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const enrollmentHistory = pgTable("enrollment_history", {
	id: text().primaryKey().notNull(),
	studentId: text("student_id").notNull(),
	schoolYear: text("school_year").notNull(),
	className: text("class_name").notNull(),
	status: text().default('COMPLETED').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [user.id],
			name: "enrollment_history_student_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const userAchievements = pgTable("user_achievements", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	achievementKey: text("achievement_key").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("user_achievements_user_key_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.achievementKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_achievements_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const wellbeingQuizResponses = pgTable("wellbeing_quiz_responses", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	answers: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "wellbeing_quiz_responses_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const schedule = pgTable("schedule", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	role: text().default('student').notNull(),
	day: text().notNull(),
	date: date(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	location: text(),
	subject: text().notNull(),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	className: text("class_name").notNull(),
	teacherId: text("teacher_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "schedule_created_by_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [user.id],
			name: "schedule_teacher_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const teacherPrograms = pgTable("teacher_programs", {
	id: text().primaryKey().notNull(),
	teacherId: text("teacher_id").notNull(),
	subject: text().notNull(),
	period: text().notNull(),
	chapter: text().notNull(),
	lesson: text().notNull(),
	topics: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const waterLogs = pgTable("water_logs", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	amountMl: integer("amount_ml").default(250).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "water_logs_user_id_user_id_fk"
		}).onDelete("cascade"),
]);
