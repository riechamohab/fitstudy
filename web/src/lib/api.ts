const API_BASE_URL = "http://localhost:3000";

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
  createdAt: string;
  updatedAt: string;
};

export async function signIn(email: string, password: string) {
  return apiRequest("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function signUp(name: string, email: string, password: string) {
  return apiRequest("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

export async function getProfile() {
  return apiRequest<UserProfile>("/api/users/profile");
}

export async function updateProfile(name: string) {
  return apiRequest<UserProfile>("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify({
      name,
    }),
  });
}

export async function getTasks() {
  return apiRequest("/api/tasks");
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