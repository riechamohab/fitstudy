import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  getClassSchedule,
  getDashboardWeek,
  getImageUrl,
  getNotifications,
  getProfile,
  getTasks,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type DashboardWeek,
  type Schedule,
  type StreakStatus,
  type Task,
  type UserProfile,
} from "../../lib/api";

import { showBrowserNotification } from "../../lib/browserNotifications";

export const Route = createFileRoute("/student/portaal")({
  component: StudentDashboardPage,
});

/* =========================================================
   HULPFUNCTIES
========================================================= */

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Goedemorgen";
  if (hour >= 12 && hour < 17) return "Goedemiddag";
  if (hour >= 17 && hour < 21) return "Goedenavond";

  return "Goedenacht";
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDutchDayName(date: Date) {
  const days = [
    "zondag",
    "maandag",
    "dinsdag",
    "woensdag",
    "donderdag",
    "vrijdag",
    "zaterdag",
  ];

  return days[date.getDay()];
}

function normalizeDayName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace("é", "e");
}

function getNormalizedDay(value: string) {
  const day = normalizeDayName(value);

  const aliases: Record<string, string> = {
    zo: "zondag",
    zondag: "zondag",

    ma: "maandag",
    maandag: "maandag",

    di: "dinsdag",
    dinsdag: "dinsdag",

    wo: "woensdag",
    woensdag: "woensdag",

    do: "donderdag",
    donderdag: "donderdag",

    vr: "vrijdag",
    vrijdag: "vrijdag",

    za: "zaterdag",
    zaterdag: "zaterdag",

    sun: "zondag",
    sunday: "zondag",

    mon: "maandag",
    monday: "maandag",

    tue: "dinsdag",
    tuesday: "dinsdag",

    wed: "woensdag",
    wednesday: "woensdag",

    thu: "donderdag",
    thursday: "donderdag",

    fri: "vrijdag",
    friday: "vrijdag",

    sat: "zaterdag",
    saturday: "zaterdag",
  };

  return aliases[day] ?? day;
}

/**
 * Controleert alleen of een rooster-item bij vandaag hoort.
 *
 * Een afgelopen les blijft dus zichtbaar.
 * Bijvoorbeeld:
 *
 * 12:00 – 12:45
 *
 * blijft om 14:00 nog steeds zichtbaar.
 */
function isScheduleForToday(
  schedule: Schedule,
  today: Date
) {
  const todayDate = getLocalDateString(today);

  const todayDay = getNormalizedDay(
    getDutchDayName(today)
  );

  if (schedule.date) {
    const scheduleDate = schedule.date.slice(0, 10);

    return scheduleDate === todayDate;
  }

  if (schedule.day) {
    const scheduleDay = getNormalizedDay(
      schedule.day
    );

    return scheduleDay === todayDay;
  }

  return false;
}

function timeToMinutes(time: string) {
  const parts = time.split(":");

  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);

  if (Number.isNaN(hours)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function formatScheduleTime(
  startTime: string,
  endTime: string
) {
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);

  return `${start} – ${end}`;
}

/* =========================================================
   ICONEN
========================================================= */

function BellIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

/* =========================================================
   DONUT CHART
========================================================= */

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
  const clamped = Math.max(
    0,
    Math.min(100, percent)
  );

  const radius = (size - strokeWidth) / 2;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
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
        transform={`rotate(-90 ${
          size / 2
        } ${size / 2})`}
        style={{
          transition:
            "stroke-dashoffset 0.5s ease",
        }}
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

/* =========================================================
   STREAK
========================================================= */

function fireColor(count: number) {
  if (count <= 7) return "#fde047";
  if (count <= 14) return "#fca5a5";
  if (count <= 31) return "#f97316";

  return "url(#fireGradient)";
}

function StreakBadge({
  count,
  status,
}: {
  count: number;
  status: StreakStatus;
}) {
  const isFrozen = status === "frozen";

  return (
    <div className="flex flex-col items-center">
      <svg
        width="72"
        height="86"
        viewBox="0 0 72 86"
      >
        <defs>
          <linearGradient
            id="fireGradient"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="#dc2626"
            />

            <stop
              offset="100%"
              stopColor="#f97316"
            />
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
          y="48"
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill={
            isFrozen
              ? "#0369a1"
              : "#7c2d12"
          }
        >
          {count}
        </text>
      </svg>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {isFrozen
          ? "Bevroren — start vandaag een sessie"
          : "dagen op rij"}
      </p>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function StudentDashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [dashboard, setDashboard] =
    useState<DashboardWeek | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [schedule, setSchedule] =
    useState<Schedule[]>([]);

  const [error, setError] = useState("");

  const [now, setNow] = useState(
    new Date()
  );

  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const seenNotifIdsRef =
    useRef<Set<string>>(new Set());

  const isFirstNotifPollRef =
    useRef(true);

  /* =======================================================
     DATA LADEN
  ======================================================= */

  useEffect(() => {
    async function load() {
      try {
        const [
          profileData,
          dashboardData,
          tasksData,
          scheduleData,
        ] = await Promise.all([
          getProfile(),
          getDashboardWeek(),
          getTasks(),
          getClassSchedule(),
        ]);

        setProfile(profileData);
        setDashboard(dashboardData);
        setTasks(tasksData);
        setSchedule(scheduleData.entries);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Kon dashboard niet laden"
        );
      }
    }

    load();

    /*
     * Alleen de klok verversen.
     */
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  /* =======================================================
     MELDINGEN
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function pollNotifications() {
      try {
        const data =
          await getNotifications();

        if (cancelled) return;

        const filtered = data.filter(
          (notification) =>
            notification.type !== "MOTIVATION"
        );

        for (const notification of filtered) {
          if (
            !seenNotifIdsRef.current.has(
              notification.id
            )
          ) {
            seenNotifIdsRef.current.add(
              notification.id
            );

            if (
              !notification.read &&
              !isFirstNotifPollRef.current
            ) {
              showBrowserNotification(
                notification.title,
                notification.message
              );
            }
          }
        }

        isFirstNotifPollRef.current = false;

        setNotifications(filtered);
      } catch {
        // Meldingen zijn niet essentieel voor het dashboard.
      }
    }

    pollNotifications();

    const interval = setInterval(
      pollNotifications,
      30_000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     MELDING HANDLERS
  ======================================================= */

  const unreadNotifCount =
    notifications.filter(
      (notification) => !notification.read
    ).length;

  async function handleOpenNotification(
    notification: AppNotification
  ) {
    if (!notification.read) {
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );

      try {
        await markNotificationRead(
          notification.id
        );
      } catch {
        // Negeer fout bij markeren als gelezen.
      }
    }
  }

  async function handleMarkAllRead() {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

    try {
      await markAllNotificationsRead();
    } catch {
      // Negeer fout bij markeren als gelezen.
    }
  }

  /* =======================================================
     BASIS DATA
  ======================================================= */

  const greeting = getGreeting(now);

  const firstName =
    profile?.name?.split(" ")[0] ?? "";

  const imageUrl = getImageUrl(
    profile?.image
  );

  /* =======================================================
     STATISTIEKEN
  ======================================================= */

  const tasksPercent =
    dashboard &&
    dashboard.tasksThisWeek.total > 0
      ? (dashboard.tasksThisWeek.completed /
          dashboard.tasksThisWeek.total) *
        100
      : 0;

  const changePercent =
    dashboard?.weeklyComparison
      .changePercent ?? null;

  /* =======================================================
     ECHT LESROOSTER VANDAAG
  ======================================================= */

  const todaysSchedule = schedule
    .filter((lesson) =>
      isScheduleForToday(lesson, now)
    )
    .sort(
      (a, b) =>
        timeToMinutes(a.startTime) -
        timeToMinutes(b.startTime)
    );

  /*
   * Maximaal vier lessen op het dashboard.
   *
   * Ook afgelopen lessen blijven zichtbaar.
   */
  const limitedSchedule =
    todaysSchedule.slice(0, 4);

  /* =======================================================
     ECHTE DEADLINES
  ======================================================= */

  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.deadline) return false;

      const deadlineTime = new Date(
        task.deadline
      ).getTime();

      if (Number.isNaN(deadlineTime)) {
        return false;
      }

      return (
        deadlineTime >= Date.now() &&
        task.status !== "COMPLETED" &&
        task.status !== "CANCELED"
      );
    })
    .sort((a, b) => {
      return (
        new Date(a.deadline!).getTime() -
        new Date(b.deadline!).getTime()
      );
    })
    .slice(0, 5);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="p-8">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}
            {firstName
              ? `, ${firstName}`
              : ""}
          </h1>

          <p className="text-sm text-slate-500">
            Laten we er vandaag iets van maken.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Meldingen */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowNotifications(
                  (value) => !value
                )
              }
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
                  <p className="text-sm font-semibold text-slate-900">
                    Meldingen
                  </p>

                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      onClick={
                        handleMarkAllRead
                      }
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
                    notifications.map(
                      (notification) => (
                        <button
                          key={
                            notification.id
                          }
                          type="button"
                          onClick={() =>
                            handleOpenNotification(
                              notification
                            )
                          }
                          className={`block w-full border-b border-slate-50 px-4 py-3 text-left last:border-0 ${
                            notification.read
                              ? "bg-white"
                              : "bg-blue-50/60"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-800">
                            {
                              notification.title
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {
                              notification.message
                            }
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(
                              notification.createdAt
                            ).toLocaleString(
                              "nl-NL",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profiel */}

          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/student/profiel-settings",
              })
            }
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-slate-100"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                {firstName || "..."}
              </p>

              <p className="text-xs text-slate-400">
                {profile?.study ||
                  "Voeg je studierichting toe"}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Profiel"
                  className="h-full w-full object-cover"
                />
              ) : firstName ? (
                firstName[0].toUpperCase()
              ) : (
                ""
              )}
            </div>
          </button>
        </div>
      </header>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ==================================================
          STATISTIEKEN
      ================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Studie-uren */}

        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <DonutChart
            percent={
              dashboard?.studyHours
                .percentOfWeek ?? 0
            }
            color="#2563eb"
            centerLabel={`${
              dashboard?.studyHours
                .percentOfWeek ?? 0
            }%`}
          />

          <p className="mt-3 text-sm font-semibold text-slate-900">
            {dashboard?.studyHours.hours ?? 0}u deze week
          </p>

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Studie-uren
          </p>
        </div>

        {/* Taken voltooid */}

        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <DonutChart
            percent={tasksPercent}
            color="#16a34a"
            centerLabel={`${
              dashboard?.tasksThisWeek
                .completed ?? 0
            }/${
              dashboard?.tasksThisWeek
                .total ?? 0
            }`}
          />

          <p className="mt-3 text-sm font-semibold text-slate-900">
            Deze week
          </p>

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Taken voltooid
          </p>
        </div>

        {/* Streak */}

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <StreakBadge
            count={
              dashboard?.streak.count ?? 0
            }
            status={
              dashboard?.streak.status ??
              "none"
            }
          />

          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Huidige streak
          </p>
        </div>

        {/* Wekelijkse voortgang */}

        <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Wekelijkse voortgang
          </p>

          {changePercent === null ? (
            <p className="mt-2 text-sm text-slate-400">
              Nog geen data van vorige week.
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                  changePercent >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {changePercent >= 0 ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )}

                {Math.abs(changePercent)}%
              </span>

              <span className="text-xs text-slate-500">
                vs. vorige week
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* =================================================
            LINKER / HOOFDKOLOM
        ================================================= */}

        <div className="lg:col-span-2">
          {/* ================================================
              SCHEMA VOOR VANDAAG
          ================================================= */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Schema voor vandaag
                </h2>

                <p className="mt-0.5 text-xs capitalize text-slate-500">
                  {now.toLocaleDateString(
                    "nl-NL",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/student/planning",
                  })
                }
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Alles bekijken
              </button>
            </div>

            {limitedSchedule.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                <p className="text-sm text-slate-500">
                  Er is geen lesrooster voor vandaag.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {limitedSchedule.map(
                  (lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800">
                            {lesson.subject ||
                              lesson.title}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-blue-600">
                            {formatScheduleTime(
                              lesson.startTime,
                              lesson.endTime
                            )}
                          </p>

                          {lesson.teacherName && (
                            <p className="mt-1 text-xs text-slate-400">
                              {lesson.teacherName}
                            </p>
                          )}

                          {lesson.location && (
                            <p className="text-xs text-slate-400">
                              {lesson.location}
                            </p>
                          )}
                        </div>

                        {lesson.className && (
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                            {lesson.className}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            RECHTERKOLOM
        ================================================= */}

        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Opkomend
              </h2>

              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/student/planning",
                  })
                }
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Alles bekijken
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                <p className="text-sm text-slate-500">
                  Geen aankomende deadlines.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const deadline =
                    task.deadline
                      ? new Date(
                          task.deadline
                        )
                      : null;

                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800">
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {
                                task.description
                              }
                            </p>
                          )}

                          {deadline && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <svg
                                className="h-3.5 w-3.5 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                />

                                <path d="M12 7v5l3 2" />
                              </svg>

                              <p className="text-xs font-semibold text-red-600">
                                {deadline.toLocaleString(
                                  "nl-NL",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                            task.priority ===
                            "HIGH"
                              ? "bg-red-100 text-red-700"
                              : task.priority ===
                                "MEDIUM"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {task.priority ===
                          "HIGH"
                            ? "Hoog"
                            : task.priority ===
                              "MEDIUM"
                            ? "Gemiddeld"
                            : "Laag"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}