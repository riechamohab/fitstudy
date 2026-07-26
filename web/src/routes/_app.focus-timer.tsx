import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  addChecklistItem,
  completeFocusSession,
  getChecklist,
  getTasks,
  startFocusSession,
  updateChecklistItem,
  type BreakType,
  type ChecklistItem,
  type FocusSession,
  type Task,
} from "../lib/api";

export const Route = createFileRoute("/_app/focus-timer")({
  component: FocusTimerPage,
});

type Phase = "select" | "focus" | "checklist" | "choose-break" | "break" | "done";

const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function FocusTimerPage() {
  const [phase, setPhase] = useState<Phase>("select");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [error, setError] = useState("");

  const [session, setSession] = useState<FocusSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        const allTasks = await getTasks();
        setTasks(allTasks.filter((t) => t.status === "ONGOING"));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load tasks");
      } finally {
        setIsLoadingTasks(false);
      }
    }
    loadTasks();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          if (phase === "focus") {
            handleFocusEnd();
          } else if (phase === "break") {
            setPhase("done");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  async function handleFocusEnd() {
    try {
      const items = await getChecklist(selectedTaskId);
      setChecklist(items);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load checklist");
    }
    setPhase("checklist");
  }

  async function handleStartFocus() {
    if (!selectedTaskId) return;

    setError("");
    try {
      const newSession = await startFocusSession(selectedTaskId, 25);
      setSession(newSession);

      const items = await getChecklist(selectedTaskId);
      setChecklist(items);

      setSecondsLeft(FOCUS_SECONDS);
      setPhase("focus");
      setIsRunning(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start session");
    }
  }

  async function handleAddChecklistItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      const item = await addChecklistItem(selectedTaskId, newItemTitle.trim());
      setChecklist((prev) => [...prev, item]);
      setNewItemTitle("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add item");
    }
  }

  async function handleToggleItem(item: ChecklistItem) {
    setChecklist((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i))
    );
    try {
      await updateChecklistItem(item.id, { completed: !item.completed });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update item");
    }
  }

  function goToChooseBreak() {
    setPhase("choose-break");
  }

  async function handleChooseBreak(breakType: BreakType) {
    if (session) {
      try {
        await completeFocusSession(session.id, breakType);
      } catch {
        // non-fatal — the break still starts locally either way
      }
    }
    setSecondsLeft(breakType === "SHORT" ? SHORT_BREAK_SECONDS : LONG_BREAK_SECONDS);
    setPhase("break");
    setIsRunning(true);
  }

  function handleRestart() {
    setPhase("select");
    setSession(null);
    setChecklist([]);
    setSecondsLeft(FOCUS_SECONDS);
    setSelectedTaskId("");
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <main className="flex min-h-[calc(100vh-0px)] items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {phase === "select" && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Focus Timer</h1>
            <p className="mb-6 text-sm text-slate-500">
              Pick a task to focus on for the next 25 minutes.
            </p>

            {isLoadingTasks ? (
              <p className="text-sm text-slate-500">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-slate-400">
                No ongoing tasks yet. Add one in your planner first.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                      selectedTaskId === task.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleStartFocus}
              disabled={!selectedTaskId}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              <PlayIcon />
              Start focus session
            </button>
          </>
        )}

        {phase === "focus" && (
          <div className="text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
              Focusing on
            </p>
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              {selectedTask?.title}
            </h2>
            <p className="mb-6 text-6xl font-bold tabular-nums text-slate-900">
              {formatClock(secondsLeft)}
            </p>
            <button
              type="button"
              onClick={handleFocusEnd}
              className="text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              End session early
            </button>
          </div>
        )}

        {phase === "checklist" && (
          <>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Nice work!</h2>
            <p className="mb-4 text-sm text-slate-500">
              Check off what you covered on "{selectedTask?.title}" before your break.
            </p>

            {checklist.length === 0 ? (
              <p className="mb-4 text-sm text-slate-400">
                No checklist yet — add what you studied below.
              </p>
            ) : (
              <div className="mb-4 space-y-2">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleItem(item)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span
                      className={item.completed ? "text-slate-400 line-through" : "text-slate-700"}
                    >
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <form onSubmit={handleAddChecklistItem} className="mb-4 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={newItemTitle}
                onChange={(event) => setNewItemTitle(event.target.value)}
                placeholder="e.g. Addition"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Add
              </button>
            </form>

            <p className="mb-4 text-xs text-slate-400">
              {completedCount}/{checklist.length} checked off
            </p>

            <button
              type="button"
              onClick={goToChooseBreak}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Continue to break
            </button>
          </>
        )}

        {phase === "choose-break" && (
          <div className="text-center">
            <h2 className="mb-1 text-xl font-bold text-slate-900">Take a break</h2>
            <p className="mb-6 text-sm text-slate-500">How long do you need?</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChooseBreak("SHORT")}
                className="rounded-xl border border-slate-200 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="text-2xl font-bold text-slate-900">5 min</p>
                <p className="text-xs text-slate-500">Short break</p>
              </button>
              <button
                type="button"
                onClick={() => handleChooseBreak("LONG")}
                className="rounded-xl border border-slate-200 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="text-2xl font-bold text-slate-900">15 min</p>
                <p className="text-xs text-slate-500">Long break</p>
              </button>
            </div>
          </div>
        )}

        {phase === "break" && (
          <div className="text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-green-600">
              On break
            </p>
            <p className="mb-6 text-6xl font-bold tabular-nums text-slate-900">
              {formatClock(secondsLeft)}
            </p>
            <button
              type="button"
              onClick={() => setPhase("done")}
              className="text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              Skip break
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold text-slate-900">Break's over</h2>
            <p className="mb-6 text-sm text-slate-500">
              Ready for another focus session?
            </p>
            <button
              type="button"
              onClick={handleRestart}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Start another session
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
