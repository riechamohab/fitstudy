import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  createTask,
  getPlanner,
  updateTask,
  type PlannerDay,
  type PlannerResponse,
  type Task,
} from "../lib/api";

export const Route = createFileRoute("/_app/planner")({
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
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
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

function DayColumn({
  day,
  onStatusChange,
}: {
  day: PlannerDay;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}) {
  const dateObj = new Date(day.date + "T00:00:00");
  const isToday = toDateKey(new Date()) === day.date;

  return (
    <div
      className={`rounded-xl border bg-white p-4 ${
        isToday ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {day.dayName}
      </p>
      <p className="mb-3 text-lg font-bold text-slate-900">
        {dateObj.getDate()}
      </p>

      {day.classSchedule.length > 0 && (
        <div className="mb-3 space-y-2">
          {day.classSchedule.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg bg-slate-50 px-3 py-2 text-xs"
            >
              <p className="font-semibold text-slate-800">{entry.subject}</p>
              <p className="text-slate-500">
                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                {entry.room ? ` · ${entry.room}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {day.tasks.length === 0 && day.classSchedule.length === 0 ? (
        <p className="text-xs text-slate-400">Nothing planned</p>
      ) : (
        <div className="space-y-2">
          {day.tasks.map((task) => (
            <div
              key={task.id}
              className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-xs"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="min-w-0 truncate font-semibold text-slate-800">
                  {task.title}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
              </div>

              {task.status === "ONGOING" && (
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => onStatusChange(task.id, "COMPLETED")}
                    className="w-full rounded-md bg-green-50 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100"
                  >
                    Mark complete
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange(task.id, "CANCELED")}
                    className="w-full rounded-md bg-slate-100 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
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
  const ongoingCount = day.tasks.filter((t) => t.status === "ONGOING").length;
  const otherCount = day.tasks.length - ongoingCount;

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
            {day.classSchedule.length} class
            {day.classSchedule.length > 1 ? "es" : ""}
          </span>
        )}

        {ongoingCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-blue-100 text-blue-700"
                : "bg-blue-50 text-blue-200"
            }`}
          >
            {ongoingCount} task{ongoingCount > 1 ? "s" : ""}
          </span>
        )}

        {otherCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              day.isCurrentMonth
                ? "bg-slate-100 text-slate-500"
                : "bg-slate-100 text-slate-300"
            }`}
          >
            {otherCount} done/other
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
  const [newTitle, setNewTitle] = useState("");
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
        error instanceof Error ? error.message : "Failed to load planner"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPlanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, referenceDate]);

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
        error instanceof Error ? error.message : "Failed to update task"
      );
    }
  }

  async function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      await createTask({
        title: newTitle.trim(),
        deadline: newDeadline || undefined,
        priority: newPriority,
      });
      setNewTitle("");
      setNewDeadline("");
      setNewPriority("MEDIUM");
      setShowAddTask(false);
      await loadPlanner();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create task"
      );
    } finally {
      setIsSaving(false);
    }
  }

  const headerLabel = (() => {
    if (!planner) return "";
    if (view === "month") {
      return referenceDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    const start = new Date(planner.rangeStart + "T00:00:00");
    const end = new Date(planner.rangeEnd + "T00:00:00");
    if (view === "day") {
      return start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    )}`;
  })();

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Planner</h1>
            <p className="text-sm text-slate-500">{headerLabel}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                    view === mode
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={goToPrevious}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Previous"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-2 text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Next"
              >
                <ChevronRightIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddTask((v) => !v)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add task
            </button>
          </div>
        </div>

        {showAddTask && (
          <form
            onSubmit={handleAddTask}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Title
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Study for chemistry test"
                required
              />
            </div>

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
                Priority
              </label>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={newPriority}
                onChange={(event) =>
                  setNewPriority(event.target.value as "LOW" | "MEDIUM" | "HIGH")
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? "Adding..." : "Add"}
            </button>
          </form>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading planner...</p>
        ) : planner ? (
          view === "month" ? (
            <div>
              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
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
          ) : (
            <div
              className={`grid gap-4 ${
                view === "day" ? "grid-cols-1 max-w-md" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-7"
              }`}
            >
              {planner.days.map((day) => (
                <DayColumn
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
