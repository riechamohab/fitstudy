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
} from "../../lib/api";

export const Route = createFileRoute("/student/focus-timer")({
  component: FocusTimerPage,
});

type Phase = "select" | "focus" | "checklist" | "choose-break" | "break" | "done";

interface TimerTypeConfig {
  id: string;
  title: string;
  description: string;
  duration: number; // in minuten
  badge: string;
  badgeColor: string;
  requiresTask: boolean;
}

const TIMER_TYPES: TimerTypeConfig[] = [
  {
    id: "pomodoro",
    title: "Pomodoro Focus",
    description: "Klassieke focussessie van 25 minuten",
    duration: 25,
    badge: "EASY",
    badgeColor: "bg-emerald-100 text-emerald-700",
    requiresTask: true,
  },
  {
    id: "quick-sprint",
    title: "Quick Sprint",
    description: "Intense productiviteitsboost van 15 minuten",
    duration: 15,
    badge: "EASY",
    badgeColor: "bg-emerald-100 text-emerald-700",
    requiresTask: true,
  },
  {
    id: "power-focus",
    title: "Power Focus",
    description: "Uitdagende diepe concentratie van 35 minuten",
    duration: 35,
    badge: "HARD",
    badgeColor: "bg-red-100 text-red-700",
    requiresTask: true,
  },
  {
    id: "deep-work",
    title: "Deep Work",
    description: "Verlengde concentratiesessie van 50 minuten",
    duration: 50,
    badge: "MEDIUM",
    badgeColor: "bg-amber-100 text-amber-700",
    requiresTask: true,
  },
  {
    id: "creative-flow",
    title: "Creative Flow",
    description: "Creatieve denkssessie van 45 minuten",
    duration: 45,
    badge: "MEDIUM",
    badgeColor: "bg-amber-100 text-amber-700",
    requiresTask: false,
  },
];

const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PeekingDog() {
  return (
    <svg
      viewBox="0 0 160 90"
      className="absolute -top-14 left-1/2 z-0 h-24 w-40 -translate-x-1/2"
      aria-hidden="true"
    >
      <ellipse cx="80" cy="46" rx="46" ry="34" fill="#F5B942" stroke="#3B2A1A" strokeWidth="3" />
      <path d="M40 40 C22 20, 18 55, 34 66 C40 60, 42 48, 40 40Z" fill="#3B2A1A" />
      <path d="M120 40 C138 20, 142 55, 126 66 C120 60, 118 48, 120 40Z" fill="#3B2A1A" />
      <circle cx="64" cy="46" r="4.5" fill="#3B2A1A" />
      <circle cx="96" cy="46" r="4.5" fill="#3B2A1A" />
      <ellipse cx="80" cy="58" rx="7" ry="5" fill="#3B2A1A" />
      <path d="M68 66 Q80 74 92 66" stroke="#3B2A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="10" y="70" width="26" height="20" rx="10" fill="#fff" stroke="#3B2A1A" strokeWidth="3" />
      <rect x="124" y="70" width="26" height="20" rx="10" fill="#fff" stroke="#3B2A1A" strokeWidth="3" />
    </svg>
  );
}

function SleepingDog() {
  return (
    <svg
      viewBox="0 0 200 90"
      className="absolute -top-16 left-1/2 z-0 h-24 w-48 -translate-x-1/2"
      aria-hidden="true"
    >
      <text x="18" y="20" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#3B2A1A">
        Zzz
      </text>
      <ellipse cx="100" cy="60" rx="70" ry="26" fill="#F5B942" stroke="#3B2A1A" strokeWidth="3" />
      <path d="M50 46 C36 34, 34 60, 46 68 C52 62, 52 52, 50 46Z" fill="#3B2A1A" />
      <path d="M150 40 C168 28, 172 15, 160 12 C150 20, 148 32, 150 40Z" fill="#3B2A1A" />
      <path d="M56 56 Q62 52 68 56" stroke="#3B2A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="66" r="9" fill="#F5B942" stroke="#3B2A1A" strokeWidth="3" />
    </svg>
  );
}

const PATTERN_TILE = `
<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
  <g fill-opacity='0.16'>
    <g transform='translate(24,28) rotate(-8)'>
      <path d='M0 0 q10 -6 20 0 v22 q-10 -6 -20 0 z' fill='#3b82f6'/>
      <path d='M40 0 q-10 -6 -20 0 v22 q10 -6 20 0 z' fill='#3b82f6'/>
    </g>
    <g transform='translate(120,36) rotate(45)'>
      <rect x='-3' y='-16' width='6' height='26' fill='#f59e0b'/>
      <polygon points='-3,10 3,10 0,18' fill='#f59e0b'/>
    </g>
    <path
      transform='translate(46,118) scale(0.9)'
      d='M12 0 15 8 24 8 17 13 19 22 12 17 5 22 7 13 0 8 9 8 Z'
      fill='#a855f7'
    />
    <g transform='translate(126,120)'>
      <circle r='11' fill='none' stroke='#22c55e' stroke-width='2.5'/>
      <circle r='4' fill='#22c55e'/>
    </g>
  </g>
</svg>`;

const PATTERN_BACKGROUND = `url("data:image/svg+xml,${encodeURIComponent(PATTERN_TILE)}")`;

function FocusTimerPage() {
  const [phase, setPhase] = useState<Phase>("select");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [error, setError] = useState("");

  const [selectedTimerConfig, setSelectedTimerConfig] = useState<TimerTypeConfig | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [session, setSession] = useState<FocusSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialiseer het audiobestand uit de public map
    audioRef.current = new Audio("/audio/alarm.mp3");
    audioRef.current.loop = true; // Blijft afgaan totdat de gebruiker het stopt

    async function loadTasks() {
      try {
        const allTasks = await getTasks();
        setTasks(allTasks.filter((t) => t.status === "ONGOING"));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Kon taken niet laden");
      } finally {
        setIsLoadingTasks(false);
      }
    }
    loadTasks();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function playAlarmAudio() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser autoplay-restricties opvangen indien nodig
      });
      setIsAlarmPlaying(true);
    }
  }

  function stopAlarmAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmPlaying(false);
  }

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          playAlarmAudio(); // Start de audio uit /public/alarm.mp3

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
  }, [isRunning, phase]);

  async function handleFocusEnd() {
    if (!selectedTaskId) {
      setPhase("choose-break");
      return;
    }
    try {
      const items = await getChecklist(selectedTaskId);
      setChecklist(items);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon checklist niet laden");
    }
    setPhase("checklist");
  }

  function handleSelectTimerType(config: TimerTypeConfig) {
    setSelectedTimerConfig(config);
    setShowTaskModal(true);
    setSelectedTaskId("");
    setError("");
  }

  async function handleStartFocus() {
    if (selectedTimerConfig?.requiresTask && !selectedTaskId) return;

    setError("");
    stopAlarmAudio();

    try {
      const durationMin = selectedTimerConfig ? selectedTimerConfig.duration : 25;
      const newSession = await startFocusSession(selectedTaskId || "general", durationMin);
      setSession(newSession);

      if (selectedTaskId) {
        const items = await getChecklist(selectedTaskId);
        setChecklist(items);
      } else {
        setChecklist([]);
      }

      setSecondsLeft(durationMin * 60);
      setShowTaskModal(false);
      setPhase("focus");
      setIsRunning(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon sessie niet starten");
    }
  }

  async function handleAddChecklistItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newItemTitle.trim() || !selectedTaskId) return;

    try {
      const item = await addChecklistItem(selectedTaskId, newItemTitle.trim());
      setChecklist((prev) => [...prev, item]);
      setNewItemTitle("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon item niet toevoegen");
    }
  }

  async function handleToggleItem(item: ChecklistItem) {
    setChecklist((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i))
    );
    try {
      await updateChecklistItem(item.id, { completed: !item.completed });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon item niet bijwerken");
    }
  }

  function goToChooseBreak() {
    stopAlarmAudio();
    setPhase("choose-break");
  }

  async function handleChooseBreak(breakType: BreakType) {
    stopAlarmAudio();
    if (session) {
      try {
        await completeFocusSession(session.id, breakType);
      } catch {
        // non-fatal
      }
    }
    setSecondsLeft(breakType === "SHORT" ? SHORT_BREAK_SECONDS : LONG_BREAK_SECONDS);
    setPhase("break");
    setIsRunning(true);
  }

  function handleRestart() {
    stopAlarmAudio();
    setPhase("select");
    setSession(null);
    setChecklist([]);
    setSecondsLeft(25 * 60);
    setSelectedTaskId("");
    setSelectedTimerConfig(null);
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <main className="relative flex min-h-[calc(100vh-0px)] items-center justify-center overflow-hidden p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: PATTERN_BACKGROUND, backgroundRepeat: "repeat" }}
      />

      <div className="relative w-full max-w-2xl">
        {phase === "focus" && <PeekingDog />}
        {phase === "break" && <SleepingDog />}

        <div className="relative z-10 rounded-2xl bg-white p-8 shadow-xl">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          {/* Alarm Banner / Stop knop als de audio afgaat */}
          {isAlarmPlaying && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-amber-500 p-4 text-white shadow-lg animate-bounce">
              <div>
                <p className="font-bold">Tijd is om!</p>
                <p className="text-xs text-amber-100">Het alarm gaat af.</p>
              </div>
              <button
                type="button"
                onClick={stopAlarmAudio}
                className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"
              >
                Stop alarm
              </button>
            </div>
          )}

          {/* 1. Overzichtsscherm: Keuze uit verschillende Focus Timers */}
          {phase === "select" && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-slate-900">Focus Exercises</h1>
              <p className="mb-6 text-sm text-slate-500">
                Kies een type focussessie om te starten.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {TIMER_TYPES.map((timer) => (
                  <div
                    key={timer.id}
                    onClick={() => handleSelectTimerType(timer)}
                    className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-400 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 text-lg">{timer.title}</h3>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${timer.badgeColor}`}>
                          {timer.badge}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{timer.description}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-400">⏱ {timer.duration} min</span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        ▶
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Modal voor taakkoppeling */}
          {showTaskModal && selectedTimerConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Focustimer</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Kies een taak om de komende {selectedTimerConfig.duration} minuten aan te werken.
                  {!selectedTimerConfig.requiresTask && (
                    <span className="block text-xs text-blue-600 mt-0.5">(Optioneel voor deze sessie)</span>
                  )}
                </p>

                {isLoadingTasks ? (
                  <p className="text-sm text-slate-500 mb-4">Taken laden...</p>
                ) : (
                  <div className="mb-6 space-y-2">
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="">-- Selecteer een taak of opdracht --</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    {tasks.length === 0 && (
                      <p className="text-xs text-slate-400">Nog geen lopende taken. Voeg er eerst een toe in je planner.</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    disabled={selectedTimerConfig.requiresTask && !selectedTaskId}
                    onClick={handleStartFocus}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Start focussessie
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Actieve Focussessie */}
          {phase === "focus" && (
            <div className="text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
                Bezig met: {selectedTimerConfig?.title}
              </p>
              <h2 className="mb-6 text-lg font-bold text-slate-900">
                {selectedTask ? selectedTask.title : "Creatieve Focussessie"}
              </h2>
              <p className="mb-6 text-6xl font-bold tabular-nums text-slate-900">
                {formatClock(secondsLeft)}
              </p>
              <button
                type="button"
                onClick={() => {
                  stopAlarmAudio();
                  handleFocusEnd();
                }}
                className="text-sm font-medium text-slate-500 hover:text-blue-600"
              >
                Sessie vroegtijdig beëindigen
              </button>
            </div>
          )}

          {/* 3. Checklist Scherm */}
          {phase === "checklist" && (
            <>
              <h2 className="mb-1 text-xl font-bold text-slate-900">Goed gedaan!</h2>
              <p className="mb-4 text-sm text-slate-500">
                Vink af wat je hebt behandeld bij &quot;{selectedTask?.title}&quot; voor je pauze.
              </p>

              {checklist.length === 0 ? (
                <p className="mb-4 text-sm text-slate-400">
                  Nog geen checklist — voeg hieronder toe wat je hebt gestudeerd.
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
                  placeholder="bijv. Onderwerp doorgenomen"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Toevoegen
                </button>
              </form>

              <p className="mb-4 text-xs text-slate-400">
                {completedCount}/{checklist.length} afgevinkt
              </p>

              <button
                type="button"
                onClick={goToChooseBreak}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Doorgaan naar pauze
              </button>
            </>
          )}

          {/* 4. Kies Pauze */}
          {phase === "choose-break" && (
            <div className="text-center">
              <h2 className="mb-1 text-xl font-bold text-slate-900">Neem een pauze</h2>
              <p className="mb-6 text-sm text-slate-500">Hoeveel tijd heb je nodig?</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChooseBreak("SHORT")}
                  className="rounded-xl border border-slate-200 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <p className="text-2xl font-bold text-slate-900">5 min</p>
                  <p className="text-xs text-slate-500">Korte pauze</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleChooseBreak("LONG")}
                  className="rounded-xl border border-slate-200 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <p className="text-2xl font-bold text-slate-900">15 min</p>
                  <p className="text-xs text-slate-500">Lange pauze</p>
                </button>
              </div>
            </div>
          )}

          {/* 5. Pauze Timer */}
          {phase === "break" && (
            <div className="text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wide text-green-600">
                Pauze
              </p>
              <p className="mb-6 text-6xl font-bold tabular-nums text-slate-900">
                {formatClock(secondsLeft)}
              </p>
              <button
                type="button"
                onClick={() => {
                  stopAlarmAudio();
                  setPhase("done");
                }}
                className="text-sm font-medium text-slate-500 hover:text-blue-600"
              >
                Pauze overslaan
              </button>
            </div>
          )}

          {/* 6. Klaar / Notificatie Scherm */}
          {phase === "done" && (
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-xl">✓</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Geweldig gedaan!</h2>
              <p className="mb-6 text-sm text-slate-500">
                Je focussessie is succesvol afgerond. Klaar voor nog een sessie?
              </p>
              <button
                type="button"
                onClick={handleRestart}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Start nog een sessie
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}