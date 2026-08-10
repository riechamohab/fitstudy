import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { getProfile, getImageUrl, type UserProfile } from "../../lib/api";
import { getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from "../../lib/api";
import {
  getTeacherStudents,
  getTeacherStudentDetails,
  type StudentProgress,
  type StudentDetails,
} from "../../lib/api";

export const Route = createFileRoute("/docent/portaal")({
  component: DocentPortaalPage,
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

function HeartIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.5 2.8c0 5.6-7.5 10.2-7.5 10.2Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function healthMeta(avgLevel: number | null) {
  if (avgLevel === null) return { label: "Onbekend", bg: "bg-slate-50", text: "text-slate-500" };
  if (avgLevel <= 5) return { label: "Goed", bg: "bg-emerald-50", text: "text-emerald-600" };
  if (avgLevel <= 7) return { label: "Matig", bg: "bg-amber-50", text: "text-amber-600" };
  return { label: "Zorgelijk", bg: "bg-rose-50", text: "text-rose-600" };
}

function HealthBadge({ avgLevel }: { avgLevel: number | null }) {
  const meta = healthMeta(avgLevel);
  return (
    <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.text}`}>
      <HeartIcon /> {meta.label}
    </span>
  );
}

function DocentPortaalPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [now] = useState(new Date());

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileData, studentsData] = await Promise.all([
          getProfile(),
          getTeacherStudents(),
        ]);
        setProfile(profileData);
        setStudents(studentsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Kon gegevens niet laden");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function loadNotifications() {
    try {
      const data = await getNotifications();

      if (!cancelled) {
        setNotifications(data);
      }
    } catch {
    }
  }

  loadNotifications();

  const interval = setInterval(loadNotifications, 30_000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setDetails(null);
      return;
    }
    setDetailsLoading(true);
    getTeacherStudentDetails(selectedStudentId)
      .then(setDetails)
      .catch(() => setDetails(null))
      .finally(() => setDetailsLoading(false));
  }, [selectedStudentId]);

  const availableClasses = useMemo(
    () => Array.from(new Set(students.map((s) => s.className).filter(Boolean))) as string[],
    [students]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesName = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === "ALL" || student.className === selectedClass;
      return matchesName && matchesClass;
    });
  }, [students, searchQuery, selectedClass]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const imageUrl = getImageUrl(profile?.image);

  async function handleOpenNotification(notif: AppNotification) {
    if (!notif.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      markNotificationRead(notif.id).catch(() => {});
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => {});
  }

  const selectedStudentSummary = students.find((s) => s.id === selectedStudentId);

  return (
    <main className="p-8">
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting(now)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Overzicht van je studenten, voortgang en welzijn.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifContainerRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className="relative text-slate-400 hover:text-slate-600"
              aria-label="Meldingen"
            >
              <BellIcon />
              {unreadNotifCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                  <p className="text-sm font-semibold text-slate-800">Meldingen</p>
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
                    <p className="p-4 text-sm text-slate-400">Geen meldingen.</p>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleOpenNotification(notif)}
                        className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                          notif.read ? "" : "bg-blue-50/40"
                        }`}
                      >
                        <p className="font-medium text-slate-800">{notif.title}</p>
                        <p className="text-xs text-slate-500">{notif.message}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{firstName || "..."}</p>
              <p className="text-xs text-slate-400">Docent</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {imageUrl ? (
                <img src={imageUrl} alt="Profiel" className="h-full w-full object-cover" />
              ) : (
                firstName ? firstName[0].toUpperCase() : ""
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ZOEKBALK + KLASFILTER */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Zoek student op naam..."
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>

        <select
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:min-w-[180px]"
        >
          <option value="ALL">Alle klassen</option>
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>
              Klas {cls}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* RESULTATENTABEL */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4">Naam</th>
              <th className="p-4">Klas</th>
              <th className="p-4 text-right">Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  Gegevens laden...
                </td>
              </tr>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{student.name}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                      {student.className ?? "—"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentId(student.id)}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      Bekijken
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  Geen studenten gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedStudentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedStudentId(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedStudentSummary?.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Klas: {details?.student.className ?? selectedStudentSummary?.className ?? "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6">
              {detailsLoading ? (
                <p className="text-sm text-slate-400">Details laden...</p>
              ) : !details ? (
                <p className="text-sm text-slate-400">Kon details niet laden.</p>
              ) : (
                <>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Welzijn
                    </h3>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Gemiddeld stressniveau: {details.stressStats.entries > 0 ? details.stressStats.avgLevel : "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Gebaseerd op {details.stressStats.entries} registratie(s).
                        </p>
                      </div>
                      <HealthBadge avgLevel={details.stressStats.entries > 0 ? details.stressStats.avgLevel : null} />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Taken
                    </h3>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-600">Voltooid:</span>
                        <span className="font-semibold text-slate-900">
                          {details.taskStats.completed} van {details.taskStats.total} taken
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${
                              details.taskStats.total > 0
                                ? (details.taskStats.completed / details.taskStats.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Cijferoverzicht
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      {details.grades.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400">Nog geen cijfers ingevoerd.</p>
                      ) : (
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-slate-200 bg-slate-100/70 text-xs text-slate-500">
                            <tr>
                              <th className="p-3">Vak</th>
                              <th className="p-3 text-right">Cijfer</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {details.grades.map((g) => (
                              <tr key={g.id}>
                                <td className="p-3 text-slate-700">{g.subject}</td>
                                <td className="p-3 text-right">
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                      g.score >= 55
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-rose-50 text-rose-600"
                                    }`}
                                  >
                                    {g.score}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
