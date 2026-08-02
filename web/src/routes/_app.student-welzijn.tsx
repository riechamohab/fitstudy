import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  completeExercise,
  createStressEntry,
  getExerciseTypes,
  getMotivation,
  getStressLevels,
  getWellbeingStatus,
  startExercise,
  type Exercise,
  type ExerciseType,
  type MotivationMessage,
  type StressEntry,
  type WellbeingStatus,
} from "../lib/api";

export const Route = createFileRoute("/_app/student-welzijn")({
  component: WellbeingPage,
});

type Tab = "ontspanning" | "begeleiding" | "registratie" | "quiz";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function statusMeta(status: WellbeingStatus["status"]) {
  switch (status) {
    case "healthy":
      return { label: "Gezond", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
    case "at_risk":
      return { label: "Risico", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" };
    case "critical":
      return { label: "Kritiek", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
    default:
      return { label: "Onbekend", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
}

function StatusBadge({ status }: { status: WellbeingStatus | null }) {
  const meta = statusMeta(status?.status ?? "unknown");
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${meta.bg}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
    </div>
  );
}

// --- Tab 1: Ontspanningsplannen ---

function RelaxationTab() {
  const [types, setTypes] = useState<ExerciseType[]>([]);
  const [active, setActive] = useState<{ exercise: Exercise; secondsLeft: number } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getExerciseTypes()
      .then(setTypes)
      .catch((error) => setError(error instanceof Error ? error.message : "Kon routines niet laden"));
  }, []);

  useEffect(() => {
    if (!active) return;

    intervalRef.current = setInterval(() => {
      setActive((prev) => {
        if (!prev) return prev;
        if (prev.secondsLeft <= 1) {
          clearInterval(intervalRef.current!);
          completeExercise(prev.exercise.id)
            .then(() => setDone(prev.exercise.type))
            .catch(() => {});
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active?.exercise.id]);

  async function handleStart(exerciseType: ExerciseType) {
    setError("");
    setDone(null);
    try {
      const exercise = await startExercise(exerciseType.type, exerciseType.duration);
      setActive({ exercise, secondsLeft: exerciseType.duration });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon routine niet starten");
    }
  }

  if (active) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
          Bezig met
        </p>
        <h3 className="mb-6 text-lg font-bold text-slate-900">{active.exercise.type}</h3>
        <p className="mb-6 text-6xl font-bold tabular-nums text-slate-900">
          {formatClock(active.secondsLeft)}
        </p>
        <button
          type="button"
          onClick={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            completeExercise(active.exercise.id)
              .then(() => setDone(active.exercise.type))
              .catch(() => {});
            setActive(null);
          }}
          className="text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          Eerder afronden
        </button>
      </div>
    );
  }

  return (
    <div>
      {done && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          "{done}" voltooid. Goed bezig!
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {types.map((exerciseType) => (
          <button
            key={exerciseType.type}
            type="button"
            onClick={() => handleStart(exerciseType)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <p className="font-semibold text-slate-900">{exerciseType.type}</p>
            <p className="mt-1 text-sm text-slate-500">{exerciseType.description}</p>
            <p className="mt-2 text-xs font-medium text-blue-600">
              {Math.round(exerciseType.duration / 60)} min
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Tab 2: Dagelijkse begeleiding ---

function GuidanceTab() {
  const [message, setMessage] = useState<MotivationMessage | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadMessage() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getMotivation();
      setMessage(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon bericht niet laden");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMessage();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Bericht laden...</p>
      ) : (
        <p className="mb-6 text-lg font-medium italic text-slate-800">
          "{message?.message}"
        </p>
      )}
      <button
        type="button"
        onClick={loadMessage}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Nieuwe tip
      </button>
    </div>
  );
}

// --- Tab 3: Stress- en slaapregistratie ---

function TrackingTab({ onNewEntry }: { onNewEntry: () => void }) {
  const [entries, setEntries] = useState<StressEntry[]>([]);
  const [level, setLevel] = useState(5);
  const [focus, setFocus] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadEntries() {
    try {
      const data = await getStressLevels(7);
      setEntries(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon registraties niet laden");
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      await createStressEntry({ level, focus, sleepHours, notes: notes || undefined });
      setSuccess(true);
      setNotes("");
      await loadEntries();
      onNewEntry();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon registratie niet opslaan");
    } finally {
      setIsSaving(false);
    }
  }

  const chartEntries = [...entries].reverse();
  const maxSleep = 10;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-slate-900">Vandaag registreren</p>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Stressniveau</span>
            <span>{level}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
            className="h-1.5 w-full accent-red-500"
          />
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Focus</span>
            <span>{focus}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={focus}
            onChange={(event) => setFocus(Number(event.target.value))}
            className="h-1.5 w-full accent-blue-500"
          />
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Uren geslapen</span>
            <span>{sleepHours}u</span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            value={sleepHours}
            onChange={(event) => setSleepHours(Number(event.target.value))}
            className="h-1.5 w-full accent-purple-500"
          />
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notities (optioneel)"
          rows={2}
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />

        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-3 text-sm text-green-700">Opgeslagen.</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? "Opslaan..." : "Registreren"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-slate-900">Laatste 7 dagen</p>

        {chartEntries.length === 0 ? (
          <p className="text-sm text-slate-400">Nog geen registraties.</p>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {chartEntries.map((entry) => (
              <div key={entry.id} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-full w-full items-end gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-red-400"
                    style={{ height: `${(entry.level / 10) * 100}%` }}
                    title={`Stress: ${entry.level}/10`}
                  />
                  {entry.sleepHours !== null && (
                    <div
                      className="flex-1 rounded-t bg-purple-400"
                      style={{ height: `${(entry.sleepHours / maxSleep) * 100}%` }}
                      title={`Slaap: ${entry.sleepHours}u`}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(entry.createdAt).toLocaleDateString("nl-NL", { day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Stress
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-400" /> Slaap
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Tab 4: Interactieve quiz (zelfreflectie, client-side, geen opslag) ---

const QUIZ_QUESTIONS = [
  {
    question: "Hoe voelde je je vandaag over het algemeen?",
    options: ["Energiek", "Neutraal", "Vermoeid", "Overweldigd"],
  },
  {
    question: "Heb je vandaag pauzes genomen tijdens het studeren?",
    options: ["Regelmatig", "Af en toe", "Bijna niet", "Helemaal niet"],
  },
  {
    question: "Hoe zou je je concentratie vandaag omschrijven?",
    options: ["Scherp", "Redelijk", "Wisselend", "Afgeleid"],
  },
];

function QuizTab() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  function handleAnswer(option: string) {
    const next = [...answers, option];
    setAnswers(next);
    if (step + 1 < QUIZ_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setFinished(true);
    }
  }

  function reset() {
    setStep(0);
    setAnswers([]);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h3 className="mb-2 text-lg font-bold text-slate-900">Bedankt voor je reflectie</h3>
        <p className="mb-6 text-sm text-slate-500">
          Even stilstaan bij hoe je je voelt is al een goede stap.
        </p>
        <div className="mb-6 space-y-2 text-left">
          {QUIZ_QUESTIONS.map((q, i) => (
            <div key={q.question} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-700">{q.question}</p>
              <p className="text-slate-500">{answers[i]}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Opnieuw
        </button>
      </div>
    );
  }

  const current = QUIZ_QUESTIONS[step];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        Vraag {step + 1} van {QUIZ_QUESTIONS.length}
      </p>
      <h3 className="mb-6 text-lg font-bold text-slate-900">{current.question}</h3>
      <div className="space-y-2">
        {current.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleAnswer(option)}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function WellbeingPage() {
  const [tab, setTab] = useState<Tab>("ontspanning");
  const [status, setStatus] = useState<WellbeingStatus | null>(null);

  async function loadStatus() {
    try {
      const data = await getWellbeingStatus();
      setStatus(data);
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "ontspanning", label: "Ontspanning" },
    { id: "begeleiding", label: "Dagelijkse begeleiding" },
    { id: "registratie", label: "Registratie" },
    { id: "quiz", label: "Quiz" },
  ];

  return (
    <main className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welzijn</h1>
            <p className="text-sm text-slate-500">Zorg goed voor jezelf, ook tijdens het studeren.</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition sm:text-sm ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "ontspanning" && <RelaxationTab />}
        {tab === "begeleiding" && <GuidanceTab />}
        {tab === "registratie" && <TrackingTab onNewEntry={loadStatus} />}
        {tab === "quiz" && <QuizTab />}
      </div>
    </main>
  );
}
