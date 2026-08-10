import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  getCourses,
  getDashboardWeek,
  getImageUrl,
  getNotes,
  getNotifications,
  getProfile,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type Course,
  type DashboardWeek,
  type Lesson,
  type StreakStatus,
  type TeacherNote,
  type UserProfile,
} from "../../lib/api";
import { showBrowserNotification } from "../../lib/browserNotifications";

export const Route = createFileRoute("/student/portaal")({
  component: StudentDashboardPage,
});

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Goedemorgen";
  if (hour >= 12 && hour < 17) return "Goedemiddag";
  if (hour >= 17 && hour < 21) return "Goedenavond";
  return "Goedenacht";
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

function ArrowUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function DonutChart({
  percent,
  color,
  centerLabel,
  size = 120,
  strokeWidth = 14,
}: {
  percent: number;
  color: string;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 5.2}
        fontWeight="bold"
        fill="#0f172a"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

function fireColor(count: number) {
  if (count <= 7) return "#fde047";
  if (count <= 14) return "#fca5a5";
  if (count <= 31) return "#f97316";
  return "url(#fireGradient)";
}

function StreakBadge({ count, status }: { count: number; status: StreakStatus }) {
  const isFrozen = status === "frozen";

  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="86" viewBox="0 0 72 86">
        <defs>
          <linearGradient id="fireGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {isFrozen ? (
          <path
            d="M36 4c8 10 18 20 18 34a18 18 0 1 1-36 0c0-14 10-24 18-34Z"
            fill="#bae6fd"
            stroke="#7dd3fc"
            strokeWidth="2"
          />
        ) : (
          <path
            d="M36 4c8 12 20 18 20 36a20 20 0 1 1-40 0c0-8 4-14 8-18 0 6 4 10 8 10-2-10 0-20 4-28Z"
            fill={fireColor(count)}
          />
        )}

        <text
          x="36"
          y="56"
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill={isFrozen ? "#0369a1" : "#7c2d12"}
        >
          {count}
        </text>
      </svg>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {isFrozen ? "Bevroren — start vandaag een sessie" : "dagen op rij"}
      </p>
    </div>
  );
}

function StudentDashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardWeek | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstNotifPollRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchCourses, setSearchCourses] = useState<Course[]>([]);
  const [searchNotes, setSearchNotes] = useState<TeacherNote[]>([]);
  const searchDataLoadedRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [profileData, dashboardData, coursesData] = await Promise.all([
          getProfile(),
          getDashboardWeek(),
          getCourses(),
        ]);
        setProfile(profileData);
        setDashboard(dashboardData);
        setCourses(coursesData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Kon dashboard niet laden"
        );
      }
    }

    load();

    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function pollNotifications() {
      try {
        const data = await getNotifications();
        if (cancelled) return;

        const filtered = data.filter((n) => n.type !== "MOTIVATION");

        for (const notif of filtered) {
          if (!seenNotifIdsRef.current.has(notif.id)) {
            seenNotifIdsRef.current.add(notif.id);
            if (!notif.read && !isFirstNotifPollRef.current) {
              showBrowserNotification(notif.title, notif.message);
            }
          }
        }

        isFirstNotifPollRef.current = false;
        setNotifications(filtered);
      } catch {
        // non-fatal
      }
    }

    pollNotifications();
    const interval = setInterval(pollNotifications, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  async function loadSearchDataIfNeeded() {
    if (searchDataLoadedRef.current) return;
    searchDataLoadedRef.current = true;
    try {
      const [coursesData, notesData] = await Promise.all([getCourses(), getNotes()]);
      setSearchCourses(coursesData);
      setSearchNotes(notesData);
    } catch {
      searchDataLoadedRef.current = false;
    }
  }

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchedCourses = trimmedQuery
    ? searchCourses.filter((c) => c.title.toLowerCase().includes(trimmedQuery))
    : [];

  const matchedLessons: { courseId: string; courseTitle: string; lesson: Lesson }[] = trimmedQuery
    ? searchCourses.flatMap((c) =>
        [...c.chapters.flatMap((ch) => ch.lessons), ...c.lessons]
          .filter((l) => l.title.toLowerCase().includes(trimmedQuery))
          .map((lesson) => ({ courseId: c.id, courseTitle: c.title, lesson }))
      )
    : [];

  const matchedNotes = trimmedQuery
    ? searchNotes.filter((n) => n.message.toLowerCase().includes(trimmedQuery))
    : [];

  const hasSearchResults =
    matchedCourses.length > 0 || matchedLessons.length > 0 || matchedNotes.length > 0;

  function closeSearch() {
    setShowSearchResults(false);
    setSearchQuery("");
  }

  async function handleOpenNotification(notif: AppNotification) {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      try {
        await markNotificationRead(notif.id);
      } catch {
        // ignore
      }
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
  }

  const greeting = getGreeting(now);
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const imageUrl = getImageUrl(profile?.image);

  const tasksPercent =
    dashboard && dashboard.tasksThisWeek.total > 0
      ? (dashboard.tasksThisWeek.completed / dashboard.tasksThisWeek.total) * 100
      : 0;

  const changePercent = dashboard?.weeklyComparison.changePercent ?? null;

  const todaysSchedule = (dashboard as any)?.todaysSchedule ?? [];
  const limitedSchedule = todaysSchedule.slice(0, 3);

  const upcomingAssignments = (dashboard as any)?.upcomingAssignments ?? [];

  return (
    <main className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Laten we er vandaag iets van maken.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={searchContainerRef}>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <SearchIcon />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  loadSearchDataIfNeeded();
                  setShowSearchResults(true);
                }}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearchResults(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSearch();
                }}
                placeholder="Zoek vakken, lessen, notities..."
                className="w-56 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>

            {showSearchResults && trimmedQuery && (
              <div className="absolute right-0 z-20 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {!hasSearchResults ? (
                  <p className="p-4 text-sm text-slate-400">Geen resultaten gevonden.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {matchedCourses.map((course) => (
                      <button
                        key={`course-${course.id}`}
                        type="button"
                        onClick={() => {
                          closeSearch();
                          navigate({ to: "/student/studieprogramma" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                          VAK
                        </span>
                        <span className="text-slate-700">{course.title}</span>
                      </button>
                    ))}

                    {matchedLessons.map(({ lesson, courseTitle }) => (
                      <button
                        key={`lesson-${lesson.id}`}
                        type="button"
                        onClick={() => {
                          closeSearch();
                          navigate({ to: "/student/studieprogramma" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">
                          LES
                        </span>
                        <span className="text-slate-700">
                          {lesson.title}
                          <span className="text-slate-400"> — {courseTitle}</span>
                        </span>
                      </button>
                    ))}

                    {matchedNotes.map((note) => (
                      <button
                        key={`note-${note.id}`}
                        type="button"
                        onClick={() => {
                          closeSearch();
                          navigate({ to: "/student/notities" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                          NOTITIE
                        </span>
                        <span className="truncate text-slate-700">{note.message}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className="relative text-slate-400 hover:text-slate-600"
              aria-label="Meldingen"
            >
              <BellIcon />
              {unreadNotifCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Meldingen</p>
                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Alles gelezen
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">
                      Geen meldingen
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleOpenNotification(notif)}
                        className={`block w-full border-b border-slate-50 px-4 py-3 text-left last:border-0 ${
                          notif.read ? "bg-white" : "bg-blue-50/60"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{notif.message}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: "/student/profiel-settings" })}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-slate-100"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{firstName || "..."}</p>
              <p className="text-xs text-slate-400">
                {profile?.study || "Voeg je studierichting toe"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {imageUrl ? (
                <img src={imageUrl} alt="Profiel" className="h-full w-full object-cover" />
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

      {/* Statistieken / Donut kaarten */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <DonutChart
            percent={dashboard?.studyHours.percentOfWeek ?? 0}
            color="#2563eb"
            centerLabel={`${dashboard?.studyHours.percentOfWeek ?? 0}%`}
          />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {dashboard?.studyHours.hours ?? 0}u deze week
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Studie-uren
          </p>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <DonutChart
            percent={tasksPercent}
            color="#16a34a"
            centerLabel={`${dashboard?.tasksThisWeek.completed ?? 0}/${
              dashboard?.tasksThisWeek.total ?? 0
            }`}
          />
          <p className="mt-3 text-sm font-semibold text-slate-900">Deze week</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Taken voltooid
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <StreakBadge
            count={dashboard?.streak.count ?? 0}
            status={dashboard?.streak.status ?? "none"}
          />
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Huidige streak
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Wekelijkse voortgang
          </p>
          {changePercent === null ? (
            <p className="mt-2 text-sm text-slate-400">Nog geen data van vorige week.</p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                  changePercent >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {changePercent >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(changePercent)}%
              </span>
              <span className="text-xs text-slate-500">vs. vorige week</span>
            </div>
          )}
        </div>
      </div>

      {/* Focuscard (Geïntegreerd i.p.v. de oude blauwe banner) */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 p-6 text-white shadow-md">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          Klaar om te focussen
        </span>
        <h2 className="mt-3 text-xl font-bold">Doorgaan: Data Structures</h2>
        <p className="mt-1 text-sm text-blue-100">
          Je bent 65% door Hoofdstuk 4. Een snelle sessie van 25 minuten helpt je om binaire bomen af te ronden.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/student/focus-timer" })}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow transition hover:bg-blue-50"
          >
            Start focussessie
          </button>
          <button
            type="button"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Onderwerp wijzigen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hoofdgedeelte */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schema voor vandaag */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Schema voor vandaag</h2>
              <button
                type="button"
                onClick={() => navigate({ to: "/student/planning" })}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Alles bekijken
              </button>
            </div>

            {limitedSchedule.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                <p className="text-sm text-slate-500">Er is niets te weergeven voor vandaag.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {limitedSchedule.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.time || "Vandaag"} • {item.duration || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voortgang per vak */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Voortgang per vak</h2>
              <p className="text-xs text-slate-500">Je actieve vakken dit semester</p>
            </div>

            {courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
                <p className="text-sm text-slate-500">
                  Er is niets te weergeven. Voeg een vak toe om voortgang bij te houden.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-slate-800">{course.title}</p>
                      <span className="text-xs font-medium text-slate-500">Actief</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rechterkolom: Opkomend */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">Opkomend</h2>
            
            {upcomingAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                <p className="text-sm text-slate-500">Er is niets te weergeven.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment: any, index: number) => (
                  <div key={index} className="rounded-lg bg-red-500 p-4 text-white shadow-sm">
                    <p className="text-sm font-bold">{assignment.title}</p>
                    <p className="mt-1 text-xs text-red-100">{assignment.dueDate || "Binnenkort"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}