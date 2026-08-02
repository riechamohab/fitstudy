// Browser-level popup notifications (Notification API). This is a per-device
// preference — not something that needs to sync across devices — so it lives
// in localStorage rather than the database.

const STORAGE_KEY = "fitstudy_browser_notifications_enabled";

export function isNotificationApiSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function isBrowserNotificationsEnabled() {
  if (!isNotificationApiSupported()) return false;
  return (
    localStorage.getItem(STORAGE_KEY) === "true" && Notification.permission === "granted"
  );
}

export async function enableBrowserNotifications(): Promise<boolean> {
  if (!isNotificationApiSupported()) return false;

  const permission = await Notification.requestPermission();
  const granted = permission === "granted";

  localStorage.setItem(STORAGE_KEY, String(granted));
  return granted;
}

export function disableBrowserNotifications() {
  localStorage.setItem(STORAGE_KEY, "false");
}

export function showBrowserNotification(title: string, body: string) {
  if (!isBrowserNotificationsEnabled()) return;

  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    // Some browsers throw if called from a background/inactive tab context —
    // not critical, just skip showing it.
  }
}