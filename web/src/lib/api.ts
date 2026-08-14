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

    if (response.status === 409) {
      throw new Error(
        backendMessage || "Deze actie is al uitgevoerd."
      );
    }

    if (response.status === 401) {
      throw new Error("Invalid email or password.");
    }

    console.error("API ERROR", {
      status: response.status,
      backendMessage,
    });

    throw new Error(
      `${response.status}: ${
        backendMessage || "Something went wrong. Please try again."
      }`
    );
  }

  return response.json() as Promise<T>;
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
  schoolYear: string | null;
  studyHistory: string | null;

  // Docentgegevens
  subjects: string[] | null;
  mentorClassName: string | null;
  mentorSchoolYear: string | null;

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
    }
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
  studentId?: string;
  schoolYear?: string;
  studyHistory?: string;
};

export async function updateProfile(data: UpdateProfileInput) {
  return apiRequest("/api/users/profile", {
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

  return response.json();
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

export async function getTasks() {
  return apiRequest<Task[]>("/api/tasks");
}

export type CreateTaskInput = {
  courseId: string;
  lessonIds?: string[];
  deadline?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
};

export async function createTask(data: CreateTaskInput) {
  return apiRequest("/api/tasks", {
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
  return apiRequest(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type Schedule = {
  id: string;
  title: string;
  role: string;
  day: string;
  date: string | null;
  startTime: string;
  endTime: string;
  location: string;
  subject: string;
  className: string;
  teacherId: string;
  teacherName: string | null;
  createdBy: string;
};

export type PlannerDay = {
  date: string;
  dayName: string;
  isCurrentMonth: boolean;
  classSchedule: Schedule[];
  tasks: Task[];
};

export type PlannerResponse = {
  view: "day" | "week" | "month";
  rangeStart: string;
  rangeEnd: string;
  days: PlannerDay[];
};

export async function getPlanner(
  view: "day" | "week" | "month",
  date: string
) {
  return apiRequest<PlannerResponse>(
    `/api/calendar/planner?view=${view}&date=${date}`
  );
}

export async function getClassSchedule() {
  return apiRequest("/api/calendar/schedule");
}

export async function getCalendar() {
  return apiRequest("/api/calendar");
}

export async function getSchedules() {
  return apiRequest<Schedule[]>("/api/schedule");
}

export async function createSchedule(data: {
  title: string;
  role?: string;
  day: string;
  date?: string;
  startTime: string;
  endTime: string;
  location?: string;
  subject: string;
  className: string;
  teacherId: string;
}) {
  return apiRequest<{ message: string; schedule: Schedule }>("/api/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(id: string) {
  return apiRequest<{ message: string }>(`/api/schedule/${id}`, {
    method: "DELETE",
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
  lessons: Lesson[];
};

export async function getCourses() {
  return apiRequest<Course[]>("/api/courses");
}

export async function createCourse(data: {
  title: string;
  description?: string;
}) {
  return apiRequest("/api/courses", {
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
  return apiRequest(`/api/courses/${courseId}/lessons`, {
    method: "POST",
    body: JSON.stringify({ title, chapterId, order }),
  });
}

export async function addChapter(
  courseId: string,
  title: string,
  order?: number
) {
  return apiRequest(`/api/courses/${courseId}/chapters`, {
    method: "POST",
    body: JSON.stringify({ title, order }),
  });
}

export async function toggleLessonItem(
  itemId: string,
  completed: boolean
) {
  return apiRequest(`/api/courses/items/${itemId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
  });
}

export async function updateLessonProgress(
  lessonId: string,
  data: {
    status?: LessonStatus;
    progressPercent?: number;
  }
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

export async function getChecklist(taskId: string): Promise<ChecklistItem[]> {
  return apiRequest<ChecklistItem[]>(`/api/tasks/${taskId}/checklist`);
}

export async function addChecklistItem(
  taskId: string,
  title: string
): Promise<ChecklistItem> {
  return apiRequest<ChecklistItem>(`/api/tasks/${taskId}/checklist`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function updateChecklistItem(
  itemId: string,
  data: {
    title?: string;
    completed?: boolean;
  }
): Promise<ChecklistItem> {
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

export async function startFocusSession(
  taskId: string,
  durationMinutes = 25
): Promise<FocusSession> {
  return apiRequest<FocusSession>("/api/focus-sessions", {
    method: "POST",
    body: JSON.stringify({
      taskId,
      durationMinutes,
    }),
  });
}

export async function completeFocusSession(
  id: string,
  breakType?: BreakType
): Promise<FocusSession> {
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

export async function getProgress() {
  return apiRequest("/api/progress");
}

export type StreakStatus =
  | "active"
  | "frozen"
  | "broken"
  | "none";

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
  teacherName: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

export async function getNotes() {
  return apiRequest<TeacherNote[]>("/api/notes");
}

export async function markNoteRead(id: string) {
  return apiRequest(`/api/notes/${id}/read`, {
    method: "PUT",
  });
}

export async function sendStudentNote(
  studentId: string,
  message: string
): Promise<{ message: string; note: TeacherNote }> {
  return apiRequest<{ message: string; note: TeacherNote }>("/api/notes/student", {
    method: "POST",
    body: JSON.stringify({
      studentId,
      message,
    }),
  });
}

export async function sendClassNote(
  className: string,
  message: string
): Promise<{ message: string; count: number }> {
  return apiRequest<{ message: string; count: number }>("/api/notes/class", {
    method: "POST",
    body: JSON.stringify({
      className,
      message,
    }),
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
  return apiRequest<AppNotification[]>(
    `/api/notifications${query}`
  );
}

export async function getNotificationCount() {
  return apiRequest<{
    total: number;
    unread: number;
  }>("/api/notifications/count");
}

export async function markNotificationRead(id: string) {
  return apiRequest(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ message: string }>(
    "/api/notifications/read-all",
    {
      method: "PUT",
    }
  );
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
  return apiRequest("/api/stress-levels", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getStressLevels(days = 7) {
  return apiRequest<StressEntry[]>(
    `/api/stress-levels?days=${days}`
  );
}

export type WellbeingStatus = {
  status: "healthy" | "at_risk" | "critical" | "unknown";
  avgStress: number | null;
  avgSleep: number | null;
  entries: number;
};

export async function getWellbeingStatus() {
  return apiRequest<WellbeingStatus>(
    "/api/stress-levels/wellbeing-status"
  );
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

export async function startExercise(
  type: string,
  duration: number
): Promise<Exercise> {
  return apiRequest<Exercise>("/api/exercises/start", {
    method: "POST",
    body: JSON.stringify({
      type,
      duration,
    }),
  });
}

export async function completeExercise(id: string) {
  return apiRequest(`/api/exercises/${id}/complete`, {
    method: "PUT",
  });
}

export type WellnessSummary = {
  avgSleepHours: number;
  completedExercisesCount: number;
  currentStreak: number;
};

export async function getWellnessSummary(): Promise<WellnessSummary> {
  return apiRequest<WellnessSummary>("/api/wellness/summary").catch(
    () => ({
      avgSleepHours: 7,
      completedExercisesCount: 0,
      currentStreak: 0,
    })
  );
}

export async function logMood(data: {
  mood: number;
  note?: string;
}) {
  return apiRequest("/api/stress-levels", {
    method: "POST",
    body: JSON.stringify({
      level: data.mood,
      focus: 3,
      notes: data.note,
    }),
  });
}

export async function logSleep(data: {
  hours: number;
  quality: string;
}) {
  return apiRequest("/api/stress-levels", {
    method: "POST",
    body: JSON.stringify({
      level: 3,
      focus: 3,
      sleepHours: data.hours,
      notes: `Kwaliteit: ${data.quality}`,
    }),
  });
}

export type WaterIntake = {
  todayMl: number;
  goalMl: number;
  totalMl: number;
  todayLogCount: number;
};

export async function getWaterIntake() {
  return apiRequest<WaterIntake>("/api/water");
}

export async function logWaterIntake(amountMl: number) {
  return apiRequest<{ id: string; amountMl: number }>(
    "/api/water",
    {
      method: "POST",
      body: JSON.stringify({ amountMl }),
    }
  );
}

export type MotivationMessage = {
  id: string;
  message: string;
  active: boolean;
};

export async function getMotivation() {
  return apiRequest<MotivationMessage>(
    "/api/progress/motivation"
  );
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

export type EnrollmentEntry = {
  id: string;
  studentId: string;
  schoolYear: string;
  className: string;
  status: "CURRENT" | "COMPLETED";
  createdAt: string;
};

export async function getEnrollmentHistory() {
  return apiRequest<EnrollmentEntry[]>(
    "/api/users/enrollment-history"
  );
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student" | "teacher";

  // Studentgegevens
  studentClass: string | null;
  studentId: string | null;
  school: string | null;
  study: string | null;
  phoneNumber: string | null;
  schoolYear: string | null;
  studyHistory: string | null;

  // Teachergegevens
  subjects: string[] | null;
  mentorClassName: string | null;
  mentorSchoolYear: string | null;

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

  studentClass?: string;
  studentId?: string;
  school?: string;
  study?: string;
  phoneNumber?: string;
  schoolYear?: string;
  studyHistory?: string;

  subjects?: string[];
  mentorClassName?: string;
  mentorSchoolYear?: string;
};

export async function createAdminUser(
  data: CreateAdminUserInput
) {
  return apiRequest<{
    message: string;
    user: AdminUser;
  }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateAdminUserInput = {
  name?: string;
  email?: string;
  role?: "student" | "teacher" | "admin";

  studentClass?: string;
  studentId?: string;
  school?: string;
  study?: string;
  phoneNumber?: string;
  schoolYear?: string;
  studyHistory?: string;

  subjects?: string[];
  mentorClassName?: string;
  mentorSchoolYear?: string;
};

export async function updateAdminUser(
  id: string,
  data: UpdateAdminUserInput
) {
  return apiRequest<{
    message: string;
    user: AdminUser;
  }>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(id: string) {
  return apiRequest<{ message: string }>(
    `/api/admin/users/${id}`,
    {
      method: "DELETE",
    }
  );
}

export type MededelingTarget =
  | "students"
  | "teachers"
  | "both";

export type MededelingPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type CreateMededelingPayload = {
  title: string;
  message: string;
  target: MededelingTarget;
  priority: MededelingPriority;
};

export type CreateMededelingResponse = {
  success: boolean;
  message: string;
};

export async function createMededeling(
  payload: CreateMededelingPayload
) {
  return apiRequest<CreateMededelingResponse>(
    "/api/mededelingen",
    {
      method: "POST",
      body: JSON.stringify({
        title: payload.title.trim(),
        message: payload.message.trim(),
        target: payload.target,
        priority: payload.priority,
      }),
    }
  );
}

export type TeacherOption = {
  id: string;
  name: string;
};

export async function getTeachersBySubject(
  subject: string
) {
  return apiRequest<TeacherOption[]>(
    `/api/schedule/teachers/by-subject?subject=${encodeURIComponent(
      subject
    )}`
  );
}

export type WeekScheduleEntry = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  location?: string;
  title?: string;
};

export async function createWeekSchedule(
  className: string,
  entries: WeekScheduleEntry[]
) {
  return apiRequest<{
    message: string;
    count: number;
    schedules: Schedule[];
  }>("/api/schedule/bulk", {
    method: "POST",
    body: JSON.stringify({
      className,
      entries,
    }),
  });
}

export interface StudentDetails {
  student: {
    id: string;
    name: string;
    email: string;
    className: string | null;
    createdAt: string;
  };
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  exerciseStats: {
    total: number;
    completed: number;
    totalMinutes: number;
  };
  stressStats: {
    avgLevel: number;
    avgFocus: number;
    entries: number;
  };
  grades: StudentDetailGrade[];
}

export interface StudentDetailGrade {
  id: string;
  subject: string;
  score: number;
  gradedAt: string;
}

export async function getTeacherStudentDetails(
  studentId: string
) {
  return apiRequest<StudentDetails>(
    `/api/teacher/students/${studentId}/details`
  );
}

export async function getTeacherSchedule() {
  return apiRequest<Schedule[]>("/api/teacher/schedule");
}

export interface TeacherTask {
  id: string;
  title: string;
  className: string;
  deadline: string | null;
  submittedCount: number;
  totalCount: number;
}

export type TeacherCourse = {
  id: string;
  title: string;
  description?: string;
};

export async function getTeacherCourses() {
  return apiRequest<TeacherCourse[]>("/api/teacher/courses");
}

export async function getTeacherTasks(
  className?: string
) {
  const url =
    className && className !== "ALL"
      ? `/api/teacher/tasks?className=${encodeURIComponent(
          className
        )}`
      : "/api/teacher/tasks";

  return apiRequest<TeacherTask[]>(url);
}

export type CreateAssignmentInput = {
  className: string;
  title: string;
  description?: string;
  deadline?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
};

export async function createAssignment(
  data: CreateAssignmentInput
) {
  return apiRequest<{
    assignmentGroupId: string;
    studentsAssigned: number;
  }>("/api/teacher/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface StudentProgress {
  id: string;
  name: string;
  className: string | null;
  teacherId?: string | null;
}

export async function getTeacherStudents(className?: string) {
  const url =
    className && className !== "ALL"
      ? `/api/teacher/students?className=${encodeURIComponent(className)}`
      : "/api/teacher/students";

  return apiRequest<StudentProgress[]>(url);
}

export interface GradeTrend {
  period: string;
  value: number;
}

export async function getTeacherGrades(
  filterId?: string
) {
  const url = filterId
    ? `/api/teacher/grades?student=${filterId}`
    : "/api/teacher/grades";

  return apiRequest<GradeTrend[]>(url);
}

export type AddGradeInput = {
  studentId: string;
  subject: string;
  score: number;
  gradedAt?: string;
};

export async function addGrade(data: AddGradeInput) {
  return apiRequest("/api/teacher/grades", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendNote(
  studentId: string,
  message: string
) {
  return apiRequest("/api/teacher/notes", {
    method: "POST",
    body: JSON.stringify({
      studentId,
      message,
    }),
  });
}

export type AnnouncementType =
  | "CLASS_CANCELED"
  | "CLASS_MOVED"
  | "TEST_ANNOUNCEMENT"
  | "GENERAL";

export async function sendAnnouncement(data: {
  className: string;
  title: string;
  message: string;
  type?: AnnouncementType;
}) {
  return apiRequest("/api/teacher/announce", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface GradePageItem {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  assessmentName: string;
  gradedAt: string;
}

export async function getTeacherGradesPage() {
  return apiRequest<GradePageItem[]>(
    "/api/teacher/grades-page"
  );
}

export type AddGradePageInput = {
  studentId: string;
  subject: string;
  score: number;
  assessmentName: string;
};

export async function addGradePage(
  data: AddGradePageInput
) {
  return apiRequest("/api/teacher/grades", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteTeacherGrade(
  gradeId: string
) {
  return apiRequest<{ message: string }>(
    `/api/teacher/grades/${gradeId}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================================
   TEACHER PROGRAMS (Vakprogramma / Behandelplan)
========================================================= */

export type TeacherProgram = {
  id: string;
  teacherId: string;
  subject: string;
  className: string;
  period: string;
  chapter: string;
  lesson: string;
  topics: string | null;
  createdAt: string;
};

export async function getTeacherPrograms() {
  return apiRequest<TeacherProgram[]>("/api/teacher/programs");
}

export type CreateTeacherProgramInput = {
  subject: string;
  className: string;
  period: string;
  chapter: string;
  lesson: string;
  topics?: string;
};

export async function createTeacherProgram(
  data: CreateTeacherProgramInput
) {
  return apiRequest<TeacherProgram>("/api/teacher/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTeacherClasses() {
  return apiRequest<{ classes: string[] }>("/api/teacher/classes");
}

export type QuizResponse = {
  id: string;
  userId: string;
  answers: {
    question: string;
    answer: string;
  }[];
  createdAt: string;
};

export async function submitQuizResponse(
  answers: {
    question: string;
    answer: string;
  }[]
): Promise<QuizResponse> {
  return apiRequest<QuizResponse>("/api/wellbeing-quiz", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function getQuizHistory() {
  return apiRequest<QuizResponse[]>(
    "/api/wellbeing-quiz"
  );
}

export function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}