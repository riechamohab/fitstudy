import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getImageUrl, getProfile, type UserProfile } from "../lib/api";

export const Route = createFileRoute("/_app/student-dashboard")({
  component: StudentDashboardPage,
});

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

const stats = [
  { label: "STUDY TIME THIS WEEK", value: "0H" },
  { label: "TASKS COMPLETED", value: "0/0" },
  { label: "CURRENT STREAK", value: "0 DAYS" },
  { label: "WEEKLY GOAL PROGRESS", value: "0%" },
];

function StudentDashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load profile"
        );
      }
    }

    loadProfile();

    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now);
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const imageUrl = getImageUrl(profile?.image);

  return (
    <main className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Let's make today productive.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
            <SearchIcon />
            <span>Search courses, notes...</span>
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            aria-label="Notifications"
          >
            <BellIcon />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/profile-settings" })}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-slate-100"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{firstName || "..."}</p>
              <p className="text-xs text-slate-400">
                {profile?.study || "Add your field of study"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {imageUrl ? (
                <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                firstName ? firstName[0].toUpperCase() : ""
              )}
            </div>
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-800">Nothing to continue yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Start a course to pick up right where you left off.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-900">Course progress</p>
          <p className="text-xs text-slate-500">Your active courses this semester</p>
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-500">
            No courses yet. Add one to start tracking progress.
          </p>
        </div>
      </div>
    </main>
  );
}
