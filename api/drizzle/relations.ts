import { relations } from "drizzle-orm/relations";
import { user, account, session, tasks, courses, exercises, notifications, progress, lessonItemProgress, lessonItems, stressLevels, lessonProgress, lessons, grades, focusSessions, taskChecklistItems, chapters, teacherNotes, achievementsUnlocked, enrollmentHistory, userAchievements, wellbeingQuizResponses, schedule, waterLogs } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	tasks_userId: many(tasks, {
		relationName: "tasks_userId_user_id"
	}),
	tasks_assignedByTeacherId: many(tasks, {
		relationName: "tasks_assignedByTeacherId_user_id"
	}),
	exercises: many(exercises),
	notifications: many(notifications),
	progresses: many(progress),
	lessonItemProgresses: many(lessonItemProgress),
	stressLevels: many(stressLevels),
	courses: many(courses),
	lessonProgresses: many(lessonProgress),
	grades_studentId: many(grades, {
		relationName: "grades_studentId_user_id"
	}),
	grades_teacherId: many(grades, {
		relationName: "grades_teacherId_user_id"
	}),
	focusSessions: many(focusSessions),
	teacherNotes_studentId: many(teacherNotes, {
		relationName: "teacherNotes_studentId_user_id"
	}),
	teacherNotes_teacherId: many(teacherNotes, {
		relationName: "teacherNotes_teacherId_user_id"
	}),
	achievementsUnlockeds: many(achievementsUnlocked),
	enrollmentHistories: many(enrollmentHistory),
	userAchievements: many(userAchievements),
	wellbeingQuizResponses: many(wellbeingQuizResponses),
	schedules_createdBy: many(schedule, {
		relationName: "schedule_createdBy_user_id"
	}),
	schedules_teacherId: many(schedule, {
		relationName: "schedule_teacherId_user_id"
	}),
	waterLogs: many(waterLogs),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	user_userId: one(user, {
		fields: [tasks.userId],
		references: [user.id],
		relationName: "tasks_userId_user_id"
	}),
	course: one(courses, {
		fields: [tasks.courseId],
		references: [courses.id]
	}),
	user_assignedByTeacherId: one(user, {
		fields: [tasks.assignedByTeacherId],
		references: [user.id],
		relationName: "tasks_assignedByTeacherId_user_id"
	}),
	progresses: many(progress),
	focusSessions: many(focusSessions),
	taskChecklistItems: many(taskChecklistItems),
}));

export const coursesRelations = relations(courses, ({one, many}) => ({
	tasks: many(tasks),
	user: one(user, {
		fields: [courses.creatorId],
		references: [user.id]
	}),
	lessons: many(lessons),
	chapters: many(chapters),
}));

export const exercisesRelations = relations(exercises, ({one}) => ({
	user: one(user, {
		fields: [exercises.userId],
		references: [user.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id]
	}),
}));

export const progressRelations = relations(progress, ({one}) => ({
	user: one(user, {
		fields: [progress.userId],
		references: [user.id]
	}),
	task: one(tasks, {
		fields: [progress.taskId],
		references: [tasks.id]
	}),
}));

export const lessonItemProgressRelations = relations(lessonItemProgress, ({one}) => ({
	user: one(user, {
		fields: [lessonItemProgress.studentId],
		references: [user.id]
	}),
	lessonItem: one(lessonItems, {
		fields: [lessonItemProgress.itemId],
		references: [lessonItems.id]
	}),
}));

export const lessonItemsRelations = relations(lessonItems, ({one, many}) => ({
	lessonItemProgresses: many(lessonItemProgress),
	lesson: one(lessons, {
		fields: [lessonItems.lessonId],
		references: [lessons.id]
	}),
}));

export const stressLevelsRelations = relations(stressLevels, ({one}) => ({
	user: one(user, {
		fields: [stressLevels.userId],
		references: [user.id]
	}),
}));

export const lessonProgressRelations = relations(lessonProgress, ({one}) => ({
	user: one(user, {
		fields: [lessonProgress.studentId],
		references: [user.id]
	}),
	lesson: one(lessons, {
		fields: [lessonProgress.lessonId],
		references: [lessons.id]
	}),
}));

export const lessonsRelations = relations(lessons, ({one, many}) => ({
	lessonProgresses: many(lessonProgress),
	course: one(courses, {
		fields: [lessons.courseId],
		references: [courses.id]
	}),
	chapter: one(chapters, {
		fields: [lessons.chapterId],
		references: [chapters.id]
	}),
	lessonItems: many(lessonItems),
}));

export const gradesRelations = relations(grades, ({one}) => ({
	user_studentId: one(user, {
		fields: [grades.studentId],
		references: [user.id],
		relationName: "grades_studentId_user_id"
	}),
	user_teacherId: one(user, {
		fields: [grades.teacherId],
		references: [user.id],
		relationName: "grades_teacherId_user_id"
	}),
}));

export const focusSessionsRelations = relations(focusSessions, ({one}) => ({
	user: one(user, {
		fields: [focusSessions.userId],
		references: [user.id]
	}),
	task: one(tasks, {
		fields: [focusSessions.taskId],
		references: [tasks.id]
	}),
}));

export const taskChecklistItemsRelations = relations(taskChecklistItems, ({one}) => ({
	task: one(tasks, {
		fields: [taskChecklistItems.taskId],
		references: [tasks.id]
	}),
}));

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	lessons: many(lessons),
	course: one(courses, {
		fields: [chapters.courseId],
		references: [courses.id]
	}),
}));

export const teacherNotesRelations = relations(teacherNotes, ({one}) => ({
	user_studentId: one(user, {
		fields: [teacherNotes.studentId],
		references: [user.id],
		relationName: "teacherNotes_studentId_user_id"
	}),
	user_teacherId: one(user, {
		fields: [teacherNotes.teacherId],
		references: [user.id],
		relationName: "teacherNotes_teacherId_user_id"
	}),
}));

export const achievementsUnlockedRelations = relations(achievementsUnlocked, ({one}) => ({
	user: one(user, {
		fields: [achievementsUnlocked.userId],
		references: [user.id]
	}),
}));

export const enrollmentHistoryRelations = relations(enrollmentHistory, ({one}) => ({
	user: one(user, {
		fields: [enrollmentHistory.studentId],
		references: [user.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(user, {
		fields: [userAchievements.userId],
		references: [user.id]
	}),
}));

export const wellbeingQuizResponsesRelations = relations(wellbeingQuizResponses, ({one}) => ({
	user: one(user, {
		fields: [wellbeingQuizResponses.userId],
		references: [user.id]
	}),
}));

export const scheduleRelations = relations(schedule, ({one}) => ({
	user_createdBy: one(user, {
		fields: [schedule.createdBy],
		references: [user.id],
		relationName: "schedule_createdBy_user_id"
	}),
	user_teacherId: one(user, {
		fields: [schedule.teacherId],
		references: [user.id],
		relationName: "schedule_teacherId_user_id"
	}),
}));

export const waterLogsRelations = relations(waterLogs, ({one}) => ({
	user: one(user, {
		fields: [waterLogs.userId],
		references: [user.id]
	}),
}));