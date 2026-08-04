export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || "http://localhost:3000";
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    const backendMessage =
      errorData?.error ||
      errorData?.message ||
      errorData?.body?.message ||
      "";

    if (response.status === 400) {
      throw new Error(
        backendMessage || "Please check your input and try again."
      );
    }

    if (response.status === 401) {
      throw new Error("Invalid email or password.");
    }

   throw new Error(
      backendMessage || "Something went wrong. Please try again."
    );
  }

  return response.json();
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "teacher" | "student" | "admin";
  studentId: string | null;
  teacherId: string | null;
  school: string | null;
  study: string | null;
  phoneNumber: string | null;
  studentClass: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export function getImageUrl(image: string | null | undefined) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_BASE_URL}${image}`;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  return apiRequest<{ success: boolean; message: string }>(
    "/api/users/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    },
  );
}
export async function signIn(email: string, password: string) {
  return apiRequest("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}
export async function signOut() {
  return apiRequest("/api/auth/sign-out", {
    method: "POST",
  });
}

export async function getProfile() {
  return apiRequest<UserProfile>("/api/users/profile");
}

export type UpdateProfileInput = {
  name?: string;
  school?: string;
  study?: string;
  phoneNumber?: string;
  studentClass?: string;
};

export async function updateProfile(data: UpdateProfileInput) {
  return apiRequest<UserProfile>("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadProfilePicture(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/users/profile/picture`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to upload image");
  }

  return response.json() as Promise<UserProfile>;
}

export type Task = {
  id: string;
  userId: string;
  courseId: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  status: "ONGOING" | "COMPLETED" | "CANCELED" | "INCOMPLETE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  updatedAt: string;
};

export type ClassScheduleEntry = {
  id: string;
  teacherId: string;
  className: string;
  subject: string;
  room: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type PlannerDay = {
  date: string;
  dayName: string;
  isCurrentMonth: boolean;
  classSchedule: ClassScheduleEntry[];
  tasks: Task[];
};

export type PlannerResponse = {
  view: "day" | "week" | "month";
  rangeStart: string;
  rangeEnd: string;
  days: PlannerDay[];
};

export async function getPlanner(view: "day" | "week" | "month", date: string) {
  return apiRequest<PlannerResponse>(
    `/api/calendar/planner?view=${view}&date=${date}`
  );
}

export type CreateTaskInput = {
  courseId: string;
  lessonIds?: string[];
  deadline?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
};

export async function createTask(data: CreateTaskInput) {
  return apiRequest<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  deadline?: string;
  status?: "ONGOING" | "COMPLETED" | "CANCELED" | "INCOMPLETE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
};

export async function updateTask(id: string, data: UpdateTaskInput) {
  return apiRequest<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type LessonStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type LessonItem = {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  completed: boolean;
};

export type Lesson = {
  id: string;
  courseId: string;
  chapterId: string | null;
  title: string;
  order: number;
  status: LessonStatus;
  progressPercent: number;
  items: LessonItem[];
};

export type Chapter = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  creatorId: string;
  scope: "class" | "personal";
  className: string | null;
  title: string;
  description: string | null;
  isOwner: boolean;
  chapters: Chapter[];
  lessons: Lesson[]; // lessons not assigned to any chapter
};

export async function getCourses() {
  return apiRequest<Course[]>("/api/courses");
}

export async function createCourse(data: { title: string; description?: string }) {
  return apiRequest<Course>("/api/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addLesson(
  courseId: string,
  title: string,
  chapterId?: string,
  order?: number
) {
  return apiRequest<Lesson>(`/api/courses/${courseId}/lessons`, {
    method: "POST",
    body: JSON.stringify({ title, chapterId, order }),
  });
}

export async function addChapter(courseId: string, title: string, order?: number) {
  return apiRequest<Chapter>(`/api/courses/${courseId}/chapters`, {
    method: "POST",
    body: JSON.stringify({ title, order }),
  });
}

export type ClassScheduleOverview = {
  className: string | null;
  entries: ClassScheduleEntry[];
};

export async function getClassSchedule() {
  return apiRequest<ClassScheduleOverview>("/api/calendar/schedule");
}

export async function toggleLessonItem(itemId: string, completed: boolean) {
  return apiRequest<LessonItem>(`/api/courses/items/${itemId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
  });
}

export async function updateLessonProgress(
  lessonId: string,
  data: { status?: LessonStatus; progressPercent?: number }
) {
  return apiRequest<{
    status: LessonStatus;
    progressPercent: number;
  }>(`/api/courses/lessons/${lessonId}/progress`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type ChecklistItem = {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
};

export async function getChecklist(taskId: string) {
  return apiRequest<ChecklistItem[]>(`/api/tasks/${taskId}/checklist`);
}

export async function addChecklistItem(taskId: string, title: string) {
  return apiRequest<ChecklistItem>(`/api/tasks/${taskId}/checklist`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function updateChecklistItem(
  itemId: string,
  data: { title?: string; completed?: boolean }
) {
  return apiRequest<ChecklistItem>(`/api/tasks/checklist/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type BreakType = "SHORT" | "LONG";

export type FocusSession = {
  id: string;
  userId: string;
  taskId: string;
  durationMinutes: number;
  breakType: BreakType | null;
  startedAt: string;
  completedAt: string | null;
};

export async function startFocusSession(taskId: string, durationMinutes = 25) {
  return apiRequest<FocusSession>("/api/focus-sessions", {
    method: "POST",
    body: JSON.stringify({ taskId, durationMinutes }),
  });
}

export async function completeFocusSession(id: string, breakType?: BreakType) {
  return apiRequest<FocusSession>(`/api/focus-sessions/${id}/complete`, {
    method: "PUT",
    body: JSON.stringify({ breakType }),
  });
}

export type MonthlyProgress = {
  month: string;
  focusSessions: {
    total: number;
    shortBreaks: number;
    longBreaks: number;
  };
  tasks: {
    completed: number;
    total: number;
    completionRate: number;
  };
  grades: {
    thisMonthAvg: number | null;
    lastMonthAvg: number | null;
    overallAvg: number | null;
    changePercent: number | null;
  };
};

export async function getMonthlyProgress() {
  return apiRequest<MonthlyProgress>("/api/progress/monthly");
}

export type Grade = {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  score: number;
  gradedAt: string;
};

export async function getGrades() {
  return apiRequest<Grade[]>("/api/progress/grades");
}

export function getProgressExportUrl() {
  return `${API_BASE_URL}/api/progress/export`;
}

export type StreakStatus = "active" | "frozen" | "broken" | "none";

export type DashboardWeek = {
  studyHours: {
    hours: number;
    minutes: number;
    percentOfWeek: number;
  };
  tasksThisWeek: {
    completed: number;
    total: number;
  };
  weeklyComparison: {
    thisWeekMinutes: number;
    lastWeekMinutes: number;
    changePercent: number | null;
  };
  streak: {
    count: number;
    status: StreakStatus;
    daysSinceLastActive: number | null;
  };
};

export async function getDashboardWeek() {
  return apiRequest<DashboardWeek>("/api/progress/dashboard-week");
}

export type TeacherNote = {
  id: string;
  studentId: string;
  teacherId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export async function getNotes() {
  return apiRequest<TeacherNote[]>("/api/notes");
}

export async function markNoteRead(id: string) {
  return apiRequest<TeacherNote>(`/api/notes/${id}/read`, {
    method: "PUT",
  });
}

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export async function getNotifications(unreadOnly?: boolean) {
  const query = unreadOnly ? "?unread=true" : "";
  return apiRequest<AppNotification[]>(`/api/notifications${query}`);
}

export async function getNotificationCount() {
  return apiRequest<{ total: number; unread: number }>("/api/notifications/count");
}

export async function markNotificationRead(id: string) {
  return apiRequest<AppNotification>(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ message: string }>("/api/notifications/read-all", {
    method: "PUT",
  });
}

export type StressEntry = {
  id: string;
  userId: string;
  level: number;
  focus: number;
  sleepHours: number | null;
  notes: string | null;
  createdAt: string;
};

export async function createStressEntry(data: {
  level: number;
  focus: number;
  sleepHours?: number;
  notes?: string;
}) {
  return apiRequest<StressEntry>("/api/stress-levels", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getStressLevels(days = 7) {
  return apiRequest<StressEntry[]>(`/api/stress-levels?days=${days}`);
}

export type WellbeingStatus = {
  status: "healthy" | "at_risk" | "critical" | "unknown";
  avgStress: number | null;
  avgSleep: number | null;
  entries: number;
};

export async function getWellbeingStatus() {
  return apiRequest<WellbeingStatus>("/api/stress-levels/wellbeing-status");
}

export type ExerciseType = {
  type: string;
  duration: number;
  description: string;
};

export async function getExerciseTypes() {
  return apiRequest<ExerciseType[]>("/api/exercises/types");
}

export type Exercise = {
  id: string;
  userId: string;
  type: string;
  duration: number;
  completed: boolean;
  createdAt: string;
};

export async function startExercise(type: string, duration: number) {
  return apiRequest<Exercise>("/api/exercises/start", {
    method: "POST",
    body: JSON.stringify({ type, duration }),
  });
}

export async function completeExercise(id: string) {
  return apiRequest<Exercise>(`/api/exercises/${id}/complete`, {
    method: "PUT",
  });
}

export type MotivationMessage = {
  id: string;
  message: string;
  active: boolean;
};

export async function getMotivation() {
  return apiRequest<MotivationMessage>("/api/progress/motivation");
}

export type EnrollmentEntry = {
  id: string;
  studentId: string;
  schoolYear: string;
  className: string;
  status: "CURRENT" | "COMPLETED";
  createdAt: string;
};
 
export async function getEnrollmentHistory() {
  return apiRequest<EnrollmentEntry[]>("/api/users/enrollment-history");
}

export type AchievementKey =
  | "FIRST_PROFILE_PICTURE"
  | "FIRST_SESSION_COMPLETED"
  | "FOCUS_SESSIONS_10"
  | "FOCUS_SESSIONS_50"
  | "FOCUS_SESSIONS_100"
  | "STUDY_HOURS_10"
  | "STUDY_HOURS_50"
  | "STUDY_HOURS_100"
  | "STUDY_HOURS_250"
  | "STUDY_HOURS_500"
  | "STREAK_7"
  | "STREAK_14"
  | "STREAK_30"
  | "STREAK_60"
  | "STREAK_100"
  | "CHECKINS_5"
  | "CHECKINS_25"
  | "WELLBEING_HEALTHY_30_DAYS"
  | "WELLBEING_HEALTHY_90_DAYS"
  | "FIRST_TASK_CREATED"
  | "TASKS_PLANNED_50"
  | "FULL_WEEK_PLANNED"
  | "FIRST_TASK_COMPLETED"
  | "TASKS_COMPLETED_50"
  | "TASKS_COMPLETED_100"
  | "BREAKS_TAKEN_25"
  | "WATER_LOGGED_100"
  | "HEALTHY_ROUTINE_30_DAYS"
  | "EARLY_BIRD_10"
  | "NIGHT_OWL_10"
  | "ACHIEVEMENTS_25"
  | "ACHIEVEMENTS_ALL";
 
export type Achievement = {
  key: AchievementKey;
  unlocked: boolean;
  unlockedAt: string | null;
};
 
export async function getAchievements() {
  return apiRequest<Achievement[]>("/api/achievements");
}
 
export type WaterIntake = {
  todayCount: number;
  totalCount: number;
};
 
export async function getWaterIntake() {
  return apiRequest<WaterIntake>("/api/water");
}
 
export async function logWaterIntake() {
  return apiRequest<{ id: string }>("/api/water", {
    method: "POST",
  });
}

export async function getTasks() {
  return apiRequest<Task[]>("/api/tasks");
}

export async function getProgress() {
  return apiRequest("/api/progress");
}

export async function getCalendar() {
  return apiRequest("/api/calendar");
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student" | "teacher";
  createdAt: string;
};

export async function getAdminUsers() {
  return apiRequest<AdminUser[]>("/api/admin/users");
}
export type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
};

export async function createAdminUser(data: CreateAdminUserInput) {
  return apiRequest("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(id: string) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}
