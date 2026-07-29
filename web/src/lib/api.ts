export const API_BASE_URL = "http://localhost:3000";

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

    if (response.status === 403) {
      throw new Error("You do not have permission to access this page.");
    }

    if (response.status === 409) {
      throw new Error("This email is already registered.");
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
  createdAt: string;
  updatedAt: string;
};

export function getImageUrl(image: string | null | undefined) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_BASE_URL}${image}`;
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

export async function signUp(
  name: string,
  email: string,
  password: string,
  studentId: string
) {
  return apiRequest("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      studentId,
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
  title: string;
  description?: string;
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

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  status: LessonStatus;
  progressPercent: number;
};

export type Course = {
  id: string;
  creatorId: string;
  scope: "class" | "personal";
  className: string | null;
  title: string;
  description: string | null;
  isOwner: boolean;
  lessons: Lesson[];
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

export async function addLesson(courseId: string, title: string, order?: number) {
  return apiRequest<Lesson>(`/api/courses/${courseId}/lessons`, {
    method: "POST",
    body: JSON.stringify({ title, order }),
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

export async function getTasks() {
  return apiRequest<Task[]>("/api/tasks");
}

export async function getNotifications() {
  return apiRequest("/api/notifications");
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