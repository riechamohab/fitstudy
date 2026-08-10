import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  completeExercise,
  createStressEntry,
  getExerciseTypes,
  getMotivation,
  getQuizHistory,
  getStressLevels,
  getWaterIntake,
  getWellbeingStatus,
  logWaterIntake,
  startExercise,
  submitQuizResponse,
  type Exercise,
  type ExerciseType,
  type MotivationMessage,
  type QuizResponse,
  type StressEntry,
  type WaterIntake,
  type WellbeingStatus,
} from "../../lib/api";

export const Route = createFileRoute("/student/welzijn")({
  component: WellbeingPage,
});

type Tab = "ontspanning" | "begeleiding" | "registratie" | "water" | "quiz";

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

// --- Text-to-speech helper (browser-native, geen backend nodig) ---
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "nl-NL";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

const BREATH_SPEECH: Record<string, string> = {
  "Diep inademen": "Diep inademen",
  "Vastthouden": "Vasthouden",
  "Langzaam uitblazen": "Langzaam uitblazen",
};

const EYE_SPEECH: Record<string, string> = {
  "Sluit je ogen": "Sluit je ogen",
  "Kijk naar rechts": "Kijk naar rechts",
  "Kijk naar links": "Kijk naar links",
  "Focus in de verte": "Focus in de verte",
};

function RelaxationTab() {
  const [types, setTypes] = useState<ExerciseType[]>([]);
  const [active, setActive] = useState<{ exercise: Exercise; secondsLeft: number } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  // Extra states voor dynamische oefening-visualizers
  const [breathPhase, setBreathPhase] = useState<"Diep inademen" | "Vastthouden" | "Langzaam uitblazen">("Diep inademen");
  const [walkStep, setWalkStep] = useState<"Rustig vertrekken" | "Normaal tempo" | "Stevig doorstappen" | "Afkoelen">("Rustig vertrekken");
  const [stretchPose, setStretchPose] = useState<"Armen omhoog strekken" | "Schouders losdraaien" | "Nek voorzichtig kantelen" | "Diep ontspannen">("Armen omhoog strekken");
  const [eyePhase, setEyePhase] = useState<"Sluit je ogen" | "Kijk naar rechts" | "Kijk naar links" | "Focus in de verte">("Sluit je ogen");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          if (subIntervalRef.current) clearInterval(subIntervalRef.current);
          stopSpeaking();
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
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
      if (subIntervalRef.current) clearInterval(subIntervalRef.current);
    };
  }, [active?.exercise.id]);

  // Cyclus voor Ademhaling (met text-to-speech)
  useEffect(() => {
    if (!active || active.exercise.type.toLowerCase() !== "breathing exercise") return;
    let elapsed = 0;

    speak(BREATH_SPEECH["Diep inademen"]);

    subIntervalRef.current = setInterval(() => {
      elapsed = (elapsed + 1) % 12;
      if (elapsed === 0) {
        setBreathPhase("Diep inademen");
        speak(BREATH_SPEECH["Diep inademen"]);
      } else if (elapsed === 4) {
        setBreathPhase("Vastthouden");
        speak(BREATH_SPEECH["Vastthouden"]);
      } else if (elapsed === 8) {
        setBreathPhase("Langzaam uitblazen");
        speak(BREATH_SPEECH["Langzaam uitblazen"]);
      }
    }, 1000);

    return () => {
      if (subIntervalRef.current) clearInterval(subIntervalRef.current);
      stopSpeaking();
    };
  }, [active?.exercise.type]);

  // Cyclus voor Quick Walk
  useEffect(() => {
    if (!active || active.exercise.type.toLowerCase() !== "quick walk") return;
    let elapsed = 0;
    const total = active.secondsLeft;
    subIntervalRef.current = setInterval(() => {
      elapsed += 1;
      const p = elapsed / total;
      if (p < 0.25) setWalkStep("Rustig vertrekken");
      else if (p < 0.6) setWalkStep("Normaal tempo");
      else if (p < 0.85) setWalkStep("Stevig doorstappen");
      else setWalkStep("Afkoelen");
    }, 1000);
    return () => { if (subIntervalRef.current) clearInterval(subIntervalRef.current); };
  }, [active?.exercise.type]);

  // Cyclus voor Stretching
  useEffect(() => {
    if (!active || active.exercise.type.toLowerCase() !== "stretching") return;
    let elapsed = 0;
    subIntervalRef.current = setInterval(() => {
      elapsed = (elapsed + 1) % 16;
      if (elapsed < 4) setStretchPose("Armen omhoog strekken");
      else if (elapsed < 8) setStretchPose("Schouders losdraaien");
      else if (elapsed < 12) setStretchPose("Nek voorzichtig kantelen");
      else setStretchPose("Diep ontspannen");
    }, 1000);
    return () => { if (subIntervalRef.current) clearInterval(subIntervalRef.current); };
  }, [active?.exercise.type]);

  // Cyclus voor Eye Rest (met text-to-speech)
  useEffect(() => {
    if (!active || !active.exercise.type.toLowerCase().includes("eye rest")) return;
    let elapsed = 0;

    speak(EYE_SPEECH["Sluit je ogen"]);

    subIntervalRef.current = setInterval(() => {
      elapsed = (elapsed + 1) % 12;
      if (elapsed === 0) {
        setEyePhase("Sluit je ogen");
        speak(EYE_SPEECH["Sluit je ogen"]);
      } else if (elapsed === 3) {
        setEyePhase("Kijk naar rechts");
        speak(EYE_SPEECH["Kijk naar rechts"]);
      } else if (elapsed === 6) {
        setEyePhase("Kijk naar links");
        speak(EYE_SPEECH["Kijk naar links"]);
      } else if (elapsed === 9) {
        setEyePhase("Focus in de verte");
        speak(EYE_SPEECH["Focus in de verte"]);
      }
    }, 1000);

    return () => {
      if (subIntervalRef.current) clearInterval(subIntervalRef.current);
      stopSpeaking();
    };
  }, [active?.exercise.type]);

  // Meditatie-audio: speelt calming.mp3 vanaf start tot einde van de oefening
  useEffect(() => {
    if (!active || !active.exercise.type.toLowerCase().includes("meditation")) return;

    const audio = new Audio("/audio/calming.mp3");
    audio.loop = true;
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, [active?.exercise.type]);

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

  function handleStopEarly() {
    if (!active) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (subIntervalRef.current) clearInterval(subIntervalRef.current);
    stopSpeaking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    completeExercise(active.exercise.id)
      .then(() => setDone(active.exercise.type))
      .catch(() => {});
    setActive(null);
  }

  if (active) {
    const typeLower = active.exercise.type.toLowerCase();
    const isMeditation = typeLower.includes("meditation");
    const isQuickWalk = typeLower.includes("quick walk");
    const isStretching = typeLower.includes("stretching");
    const isEyeRest = typeLower.includes("eye rest");

    return (
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 text-center text-white shadow-xl flex flex-col items-center justify-between min-h-[420px]">
        <div className="w-full flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            {active.exercise.type}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tabular-nums text-indigo-200">
            {formatClock(active.secondsLeft)}
          </span>
        </div>

        {/* Unieke Visualizers */}
        {isMeditation ? (
          <div className="relative my-6 flex items-center justify-center h-48 w-48">
            <div className="absolute h-44 w-44 rounded-full bg-teal-400/20 blur-xl animate-ping" />
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white shadow-2xl border border-white/20">
              <span className="text-[11px] font-bold uppercase tracking-widest text-teal-100">Rust</span>
            </div>
          </div>
        ) : isQuickWalk ? (
          <div className="relative my-6 flex flex-col items-center justify-center h-48 w-48">
            <div className="absolute h-44 w-44 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg border border-white/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Tempo</span>
              <span className="text-xs font-extrabold px-2 text-center leading-tight mt-1">{walkStep}</span>
            </div>
          </div>
        ) : isStretching ? (
          <div className="relative my-6 flex flex-col items-center justify-center h-48 w-48">
            <div className="absolute h-44 w-44 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg border border-white/20 animate-bounce">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100">Stretch</span>
              <span className="text-xs font-extrabold px-2 text-center leading-tight mt-1">{stretchPose}</span>
            </div>
          </div>
        ) : isEyeRest ? (
          <div className="relative my-6 flex flex-col items-center justify-center h-48 w-48">
            <div className="absolute h-44 w-44 rounded-full bg-sky-500/20 blur-xl animate-pulse" />
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-lg border border-white/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100">Ogen</span>
              <span className="text-xs font-extrabold px-2 text-center leading-tight mt-1">{eyePhase}</span>
            </div>
          </div>
        ) : (
          <div className="relative my-6 flex items-center justify-center h-48 w-48">
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-100">Adem</span>
              <span className="text-xs font-extrabold px-2 text-center leading-tight mt-1">{breathPhase}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleStopEarly}
          className="rounded-xl bg-white/10 px-6 py-2.5 text-xs font-semibold text-indigo-200 transition hover:bg-white/25"
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
  const alreadyRegisteredToday = entries.some((entry) => isToday(entry.createdAt));

  // Coördinaten berekenen voor SVG lijngrafieken
  const maxStress = 10;
  const maxSleep = 12;
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 20;

  const pointsCount = chartEntries.length;
  const stepX = pointsCount > 1 ? (svgWidth - paddingX * 2) / (pointsCount - 1) : 0;

  const stressPoints = chartEntries.map((entry, index) => {
    const x = paddingX + index * stepX;
    const y = svgHeight - paddingY - ((entry.level / maxStress) * (svgHeight - paddingY * 2));
    return { x, y, value: entry.level, date: new Date(entry.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) };
  });

  const sleepPoints = chartEntries.map((entry, index) => {
    const x = paddingX + index * stepX;
    const sleepVal = entry.sleepHours ?? 0;
    const y = svgHeight - paddingY - ((sleepVal / maxSleep) * (svgHeight - paddingY * 2));
    return { x, y, value: sleepVal };
  });

  const stressLinePath = stressPoints.length > 0 ? stressPoints.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "") : "";
  const sleepLinePath = sleepPoints.length > 0 ? sleepPoints.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "") : "";

  return (
    <div className="space-y-6">
      {alreadyRegisteredToday ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Je hebt vandaag al een registratie ingevuld.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Morgen kun je opnieuw je stress, focus en slaap registreren.
          </p>
        </div>
      ) : (
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
      )}

      {/* Vernieuwde Lijngrafiek voor Slaap- en Stresspatroon */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-slate-900">Slaap- en stresspatroon (Laatste 7 dagen)</p>

        {chartEntries.length === 0 ? (
          <p className="text-sm text-slate-400">Nog geen registraties.</p>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
              {/* Rasterlijnen */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" />

              {/* Stress Lijn */}
              {stressLinePath && <path d={stressLinePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              
              {/* Slaap Lijn */}
              {sleepLinePath && <path d={sleepLinePath} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Datapunten & Tooltips */}
              {stressPoints.map((p, i) => (
                <g key={`stress-${i}`}>
                  <circle cx={p.x} cy={p.y} r="4" className="fill-red-500 transition-all hover:scale-125" />
                  <text x={p.x} y={svgHeight - 4} textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">
                    {p.date}
                  </text>
                </g>
              ))}

              {sleepPoints.map((p, i) => (
                <circle key={`sleep-${i}`} cx={p.x} cy={p.y} r="4" className="fill-purple-500 transition-all hover:scale-125" />
              ))}
            </svg>
          </div>
        )}

        <div className="mt-4 flex gap-6 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Stressniveau (1-10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Slaapuren (0-12u)
          </span>
        </div>
      </div>
    </div>
  );
}

const WATER_PRESETS_ML = [150, 250, 500];

function WaterTab() {
  const [intake, setIntake] = useState<WaterIntake | null>(null);
  const [error, setError] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  async function loadIntake() {
    try {
      const data = await getWaterIntake();
      setIntake(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon waterinname niet laden");
    }
  }

  useEffect(() => {
    loadIntake();
  }, []);

  async function handleLog(amountMl: number) {
    setIsLogging(true);
    setError("");
    try {
      await logWaterIntake(amountMl);
      await loadIntake();
      setCustomAmount("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon waterinname niet loggen");
    } finally {
      setIsLogging(false);
    }
  }

  function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(customAmount);
    if (!amount || amount <= 0) {
      setError("Vul een geldig aantal ml in.");
      return;
    }
    handleLog(amount);
  }

  const todayMl = intake?.todayMl ?? 0;
  const goalMl = intake?.goalMl ?? 2500;
  const percent = Math.min(100, Math.round((todayMl / goalMl) * 100));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <p className="mb-1 text-sm font-medium uppercase tracking-wide text-blue-600">
        Vandaag
      </p>
      <p className="mb-4 text-5xl font-bold text-slate-900">
        {todayMl}
        <span className="text-lg font-medium text-slate-400"> / {goalMl} ml</span>
      </p>

      <div className="mx-auto mb-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mb-4 flex justify-center gap-2">
        {WATER_PRESETS_ML.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleLog(amount)}
            disabled={isLogging}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            +{amount} ml
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomSubmit} className="mx-auto flex max-w-xs gap-2">
        <input
          type="number"
          min={1}
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          placeholder="Aangepast aantal ml"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLogging}
          className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Loggen
        </button>
      </form>

      {intake && (
        <p className="mt-4 text-xs text-slate-400">
          In totaal {intake.totalMl} ml gelogd ({intake.todayLogCount} keer vandaag)
        </p>
      )}
    </div>
  );
}

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
  const [saveError, setSaveError] = useState("");

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [todaysResponse, setTodaysResponse] = useState<QuizResponse | null>(null);

  useEffect(() => {
    getQuizHistory()
      .then((history) => {
        const todays = history.find((r) => isToday(r.createdAt));
        setTodaysResponse(todays ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  async function handleAnswer(option: string) {
    const next = [...answers, option];
    setAnswers(next);

    if (step + 1 < QUIZ_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setFinished(true);
      try {
        const saved = await submitQuizResponse(
          QUIZ_QUESTIONS.map((q, i) => ({ question: q.question, answer: next[i] }))
        );
        setTodaysResponse(saved);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Kon je antwoorden niet opslaan."
        );
      }
    }
  }

  if (loadingHistory) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Laden...</p>
      </div>
    );
  }

  if (todaysResponse) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h3 className="mb-2 text-lg font-bold text-slate-900">
          Je hebt de quiz vandaag al ingevuld
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Morgen kun je opnieuw meedoen. Hier zijn je antwoorden van vandaag:
        </p>
        <div className="space-y-2 text-left">
          {todaysResponse.answers.map((a) => (
            <div key={a.question} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-700">{a.question}</p>
              <p className="text-slate-500">{a.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h3 className="mb-2 text-lg font-bold text-slate-900">Bedankt voor je reflectie</h3>
        <p className="mb-6 text-sm text-slate-500">
          Even stilstaan bij hoe je je voelt is al een goede stap. Morgen kun je opnieuw meedoen.
        </p>
        {saveError && (
          <p className="mb-4 text-sm text-red-600">{saveError}</p>
        )}
        <div className="space-y-2 text-left">
          {QUIZ_QUESTIONS.map((q, i) => (
            <div key={q.question} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-700">{q.question}</p>
              <p className="text-slate-500">{answers[i]}</p>
            </div>
          ))}
        </div>
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
      // Stil falen toestaan indien niet beschikbaar
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "ontspanning", label: "Ontspanning" },
    { id: "begeleiding", label: "Dagelijkse begeleiding" },
    { id: "registratie", label: "Registratie" },
    { id: "water", label: "Waterinname" },
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
        {tab === "water" && <WaterTab />}
        {tab === "quiz" && <QuizTab />}
      </div>
    </main>
  );
}
