import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  createTask,
  getCourses,
  getPlanner,
  updateTask,
  type Course,
  type PlannerDay,
  type PlannerResponse,
  type Task,
} from "../lib/api";

export const Route = createFileRoute("/student/planning")({
  component: PlannerPage,
});

type ViewMode = "day" | "week" | "month";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function statusLabel(status: Task["status"]) {
  switch (status) {
    case "COMPLETED":
      return "Voltooid";
    case "CANCELED":
      return "Geannuleerd";
    case "INCOMPLETE":
      return "Niet voltooid";
    default:
      return "Bezig";
  }
}

function statusBadgeClass(status: Task["status"]) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELED":
      return "bg-slate-200 text-slate-500";
    case "INCOMPLETE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function ChevronLeftIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 19 8 12l7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function WeekDayCell({
  day,
  onSelect,
}: {
  day: PlannerDay;
  onSelect: (date: string) => void;
}) {
  const dateObj = new Date(day.date + "T00:00:00");
  const isToday = toDateKey(new Date()) === day.date;
  const completedCount = day.tasks.filter((t) => t.status === "COMPLETED").length;
  const ongoingCount = day.tasks.filter((t) => t.status === "ONGOING").length;
  const canceledCount = day.tasks.filter((t) => t.status === "CANCELED").length;
  const incompleteCount = day.tasks.filter((t) => t.status === "INCOMPLETE").length;

  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      className={`flex min-h-[110px] flex-col items-start rounded-xl border bg-white p-3 text-left transition hover:border-blue-300 ${
        isToday ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {day.dayName}
      </p>
      <p className="mb-2 text-lg font-bold text-slate-900">{dateObj.getDate()}</p>

      <div className="flex flex-wrap gap-1">
        {day.classSchedule.length > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            {day.classSchedule.length} les{day.classSchedule.length > 1 ? "sen" : ""}
          </span>
        )}
        {ongoingCount > 0 && (
          <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
            {ongoingCount} {ongoingCount > 1 ? "taken" : "taak"}
          </span>
        )}
        {completedCount > 0 && (
          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
            {completedCount} afgerond
          </span>
        )}
        {canceledCount > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {canceledCount} geannuleerd
          </span>
        )}
        {incompleteCount > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
            {incompleteCount} verstreken
          </span>
        )}
      </div>

      {day.tasks.length === 0 && day.classSchedule.length === 0 && (
        <p className="mt-1 text-[11px] text-slate-300">Niets gepland</p>
      )}
    </button>
  );
}

function DayDetailList({
  day,
  onStatusChange,
}: {
  day: PlannerDay;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {day.classSchedule.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Lesrooster
          </p>
          {day.classSchedule.map((entry) => (
            <div key={entry.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-semibold text-slate-800">{entry.subject}</p>
              <p className="text-slate-500">
                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                {entry.room ? ` · ${entry.room}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Taken
      </p>

      {day.tasks.length === 0 ? (
        <p className="text-sm text-slate-400">Geen taken voor deze dag.</p>
      ) : (
        <div className="space-y-2">
          {day.tasks.map((task) => {
            const isOpen = openTaskId === task.id;
            const isLocked = task.status !== "ONGOING";

            return (
              <div key={task.id} className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (isLocked) return;
                    setOpenTaskId(isOpen ? null : task.id);
                  }}
                  disabled={isLocked}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left ${
                    isLocked ? "cursor-default" : ""
                  }`}
                >
                  <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                    {task.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                      task.status
                    )}`}
                  >
                    {statusLabel(task.status)}
                  </span>
                </button>

                {isOpen && !isLocked && (
                  <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onStatusChange(task.id, "COMPLETED")}
                      className="flex-1 rounded-md bg-green-50 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      Voltooid
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(task.id, "CANCELED")}
                      className="flex-1 rounded-md bg-slate-100 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Geannuleerd
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(task.id, "INCOMPLETE")}
                      className="flex-1 rounded-md bg-red-50 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Onvoltooid
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthCell({
  day,
  onSelect,
}: {
  day: PlannerDay;
  onSelect: (date: string) => void;
}) {
  const dateObj = new Date(day.date + "T00:00:00");
  const isToday = toDateKey(new Date()) === day.date;
  const completedCount = day.tasks.filter((t) => t.status === "COMPLETED").length;
  const ongoingCount = day.tasks.filter((t) => t.status === "ONGOING").length;
  const canceledCount = day.tasks.filter((t) => t.status === "CANCELED").length;
  const incompleteCount = day.tasks.filter((t) => t.status === "INCOMPLETE").length;

  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      className={`flex min-h-[92px] flex-col items-start rounded-lg border p-2 text-left transition hover:border-blue-300 ${
        isToday
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-slate-200 bg-white"
      } ${!day.isCurrentMonth ? "bg-slate-50" : "bg-white"}`}
    >
      <span
        className={`mb-1 text-sm font-semibold ${
          day.isCurrentMonth ? "text-slate-900" : "text-slate-300"
        }`}
      >
        {dateObj.getDate()}
      </span>

      <div className="flex flex-wrap gap-1">
        {day.classSchedule.length > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-slate-100 text-slate-600"
                : "bg-slate-100 text-slate-300"
            }`}
          >
            {day.classSchedule.length} les
            {day.classSchedule.length > 1 ? "sen" : ""}
          </span>
        )}

        {ongoingCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-yellow-100 text-yellow-700"
                : "bg-yellow-50 text-yellow-200"
            }`}
          >
            {ongoingCount} {ongoingCount > 1 ? "taken" : "taak"}
          </span>
        )}

        {completedCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-green-100 text-green-700"
                : "bg-green-50 text-green-200"
            }`}
          >
            {completedCount} afgerond
          </span>
        )}

        {canceledCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-slate-100 text-slate-500"
                : "bg-slate-100 text-slate-300"
            }`}
          >
            {canceledCount} geannuleerd
          </span>
        )}

        {incompleteCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-red-100 text-red-700"
                : "bg-red-50 text-red-200"
            }`}
          >
            {incompleteCount} verstreken
          </span>
        )}
      </div>
    </button>
  );
}

function PlannerPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [planner, setPlanner] = useState<PlannerResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showAddTask, setShowAddTask] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [newDeadline, setNewDeadline] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [isSaving, setIsSaving] = useState(false);

  async function loadPlanner() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPlanner(view, toDateKey(referenceDate));
      setPlanner(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Kon planner niet laden"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPlanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, referenceDate]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch {
        // non-fatal — the add-task form will just show "geen vakken" if this fails
      }
    }
    loadCourses();
  }, []);

  function goToPrevious() {
    const next = new Date(referenceDate);
    if (view === "day") next.setDate(next.getDate() - 1);
    else if (view === "week") next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setReferenceDate(next);
  }

  function goToNext() {
    const next = new Date(referenceDate);
    if (view === "day") next.setDate(next.getDate() + 1);
    else if (view === "week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setReferenceDate(next);
  }

  function goToToday() {
    setReferenceDate(new Date());
  }

  async function handleStatusChange(taskId: string, status: Task["status"]) {
    try {
      await updateTask(taskId, { status });
      await loadPlanner();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Kon taak niet bijwerken"
      );
    }
  }

  function toggleLesson(lessonId: string) {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  }

  async function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCourseId) return;

    setIsSaving(true);
    setError("");

    try {
      await createTask({
        courseId: selectedCourseId,
        lessonIds: selectedLessonIds.length > 0 ? selectedLessonIds : undefined,
        deadline: newDeadline || undefined,
        priority: newPriority,
      });
      setSelectedCourseId("");
      setSelectedLessonIds([]);
      setNewDeadline("");
      setNewPriority("MEDIUM");
      setShowAddTask(false);
      await loadPlanner();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Kon taak niet aanmaken"
      );
    } finally {
      setIsSaving(false);
    }
  }

  const headerLabel = (() => {
    if (!planner) return "";
    if (view === "month") {
      return referenceDate.toLocaleDateString("nl-NL", {
        month: "long",
        year: "numeric",
      });
    }
    const start = new Date(planner.rangeStart + "T00:00:00");
    const end = new Date(planner.rangeEnd + "T00:00:00");
    if (view === "day") {
      return start.toLocaleDateString("nl-NL", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return `${start.toLocaleDateString("nl-NL", { month: "short", day: "numeric" })} - ${end.toLocaleDateString(
      "nl-NL",
      { month: "short", day: "numeric", year: "numeric" }
    )}`;
  })();

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Planner</h1>
            <p className="text-sm text-slate-500 capitalize">{headerLabel}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {([
                { mode: "day" as ViewMode, label: "Dag" },
                { mode: "week" as ViewMode, label: "Week" },
                { mode: "month" as ViewMode, label: "Maand" },
              ]).map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    view === mode
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={goToPrevious}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Vorige"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-2 text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                Vandaag
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Volgende"
              >
                <ChevronRightIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddTask((v) => !v)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Taak toevoegen
            </button>
          </div>
        </div>

        {showAddTask && (
          <form
            onSubmit={handleAddTask}
            className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Vak
              </label>
              {courses.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Geen vakken gevonden. Voeg eerst een vak toe bij Vakken.
                </p>
              ) : (
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={selectedCourseId}
                  onChange={(event) => {
                    setSelectedCourseId(event.target.value);
                    setSelectedLessonIds([]);
                  }}
                  required
                >
                  <option value="" disabled>
                    Kies een vak
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                      {course.scope === "class" ? ` (${course.className})` : " (persoonlijk)"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCourseId && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Lessen (optioneel)
                </label>
                {(() => {
                  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
                  const hasAnyLessons =
                    selectedCourse &&
                    (selectedCourse.chapters.some((ch) => ch.lessons.length > 0) ||
                      selectedCourse.lessons.length > 0);

                  if (!selectedCourse || !hasAnyLessons) {
                    return (
                      <p className="text-sm text-slate-400">
                        Dit vak heeft nog geen lessen.
                      </p>
                    );
                  }

                  function LessonChip({ id, title }: { id: string; title: string }) {
                    const isChecked = selectedLessonIds.includes(id);
                    return (
                      <button
                        type="button"
                        onClick={() => toggleLesson(id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isChecked
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {title}
                      </button>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {selectedCourse.chapters
                        .filter((chapter) => chapter.lessons.length > 0)
                        .map((chapter) => (
                          <div key={chapter.id}>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {chapter.title}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {chapter.lessons.map((lesson) => (
                                <LessonChip key={lesson.id} id={lesson.id} title={lesson.title} />
                              ))}
                            </div>
                          </div>
                        ))}

                      {selectedCourse.lessons.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedCourse.lessons.map((lesson) => (
                            <LessonChip key={lesson.id} id={lesson.id} title={lesson.title} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={newDeadline}
                  onChange={(event) => setNewDeadline(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Prioriteit
                </label>
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={newPriority}
                  onChange={(event) =>
                    setNewPriority(event.target.value as "LOW" | "MEDIUM" | "HIGH")
                  }
                >
                  <option value="LOW">Laag</option>
                  <option value="MEDIUM">Gemiddeld</option>
                  <option value="HIGH">Hoog</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving || !selectedCourseId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Toevoegen..." : "Toevoegen"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Planner laden...</p>
        ) : planner ? (
          view === "month" ? (
            <div>
              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {planner.days.map((day) => (
                  <MonthCell
                    key={day.date}
                    day={day}
                    onSelect={(date) => {
                      setReferenceDate(new Date(date + "T00:00:00"));
                      setView("day");
                    }}
                  />
                ))}
              </div>
            </div>
          ) : view === "week" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
              {planner.days.map((day) => (
                <WeekDayCell
                  key={day.date}
                  day={day}
                  onSelect={(date) => {
                    setReferenceDate(new Date(date + "T00:00:00"));
                    setView("day");
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="max-w-md">
              {planner.days.map((day) => (
                <DayDetailList
                  key={day.date}
                  day={day}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </main>
  );
}
