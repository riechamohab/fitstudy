import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { getAchievements, getNotes, getNotifications, signOut, type Achievement, type TeacherNote } from "../lib/api";
import { ACHIEVEMENT_DEFINITIONS, RARITY_META } from "../lib/achievementDefinitions";
import { showBrowserNotification } from "../lib/browserNotifications";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const proTips = [
"Korte focussessies van 25 minuten verhogen je concentratie.",
"Herhaal je aantekeningen binnen 24 uur.",
"Overhoor jezelf in plaats van alleen te herlezen.",
"Leg de leerstof hardop uit om je begrip te testen.",
"Verdeel grote opdrachten in kleine, haalbare stappen.",
"Stel elke studiesessie één duidelijk doel.",
"Werk op een rustige, opgeruimde plek.",
"Schakel meldingen uit tijdens het studeren.",
"Neem elke 25 minuten een korte pauze.",
"Drink regelmatig water tijdens het studeren.",
"Zorg voor 7 tot 9 uur slaap per nacht.",
"Rek je even uit tijdens je pauzes.",
"Eet voedzame snacks voor langdurige energie.",
"Beweeg dagelijks minstens 30 minuten.",
"Geef je ogen rust met de 20-20-20-regel.",
"Gun jezelf rust zonder schuldgevoel."
];

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="12" width="8" height="9" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
    </svg>
  );
}

function PlannerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  );
}

function CoursesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M4 5.5v15" />
    </svg>
  );
}

function FocusTimerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9.5 2h5" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5M9 12h6M9 16h6" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function WellbeingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.5 2.8c0 5.6-7.5 10.2-7.5 10.2Z" />
    </svg>
  );
}

function AchievementsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", icon: DashboardIcon, path: "/student-dashboard" },
  { label: "Planner", icon: PlannerIcon, path: "/student-planner" },
  { label: "Studieprogramma", icon: CoursesIcon, path: "/student-courses" },
  { label: "Focus Timer", icon: FocusTimerIcon, path: "/focus-timer" as const },
  { label: "Notities", icon: NotesIcon, path: "/student-notes" },
];

const insightItems = [
  { label: "Progress", icon: ProgressIcon, path: "/student-progress" as const },
  { label: "Welzijn", icon: WellbeingIcon, path: "/student-welzijn" },
  { label: "Achievements", icon: AchievementsIcon, path: "/student-achievements" },
];

function AppLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

 const [tipIndex, setTipIndex] = useState(0);
const [isSigningOut, setIsSigningOut] = useState(false);
const [notes, setNotes] = useState<TeacherNote[]>([]);
const seenNoteIdsRef = useRef<Set<string>>(new Set());
const [celebrating, setCelebrating] = useState<Achievement | null>(null);
const seenAchievementKeysRef = useRef<Set<string>>(new Set());

useEffect(() => {
  try {
    const saved = localStorage.getItem("fitstudy_celebrated_achievements");

    if (saved) {
      seenAchievementKeysRef.current = new Set(JSON.parse(saved));
    }
  } catch (error) {
    console.error("Failed to load celebrated achievements:", error);
    seenAchievementKeysRef.current = new Set();
  }
}, []);

useEffect(() => {
  setTipIndex(Math.floor(Math.random() * proTips.length));
}, []);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * proTips.length));
  }, []);

  const isFirstPollRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function pollNotes() {
      try {
        const wasFirstPoll = isFirstPollRef.current;

        const data = await getNotes();
        if (cancelled) return;

        for (const note of data) {
          if (!seenNoteIdsRef.current.has(note.id)) {
            seenNoteIdsRef.current.add(note.id);
            if (!note.read && !wasFirstPoll) {
              showBrowserNotification("Nieuw bericht van je docent", note.message);
            }
          }
        }

        setNotes(data);

        try {
          const notifs = await getNotifications();
          for (const notif of notifs) {
            if (!seenNoteIdsRef.current.has(`notif:${notif.id}`)) {
              seenNoteIdsRef.current.add(`notif:${notif.id}`);
              if (!notif.read && !wasFirstPoll) {
                showBrowserNotification(notif.title, notif.message);
              }
            }
          }
        } catch {
        }

        try {
          const achievements = await getAchievements();
          for (const achievement of achievements) {
            if (achievement.unlocked && !seenAchievementKeysRef.current.has(achievement.key)) {
              seenAchievementKeysRef.current.add(achievement.key);
              localStorage.setItem(
                "fitstudy_celebrated_achievements",
                JSON.stringify(Array.from(seenAchievementKeysRef.current))
              );
              if (!wasFirstPoll) {
                setCelebrating(achievement);
              }
            }
          }
        } catch {
        }

        isFirstPollRef.current = false;
      } catch {
      }
    }

    pollNotes();
    const interval = setInterval(pollNotes, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadNoteCount = notes.filter((n) => !n.read).length;

  function rotateTip() {
    setTipIndex((current) => {
      if (proTips.length <= 1) return current;
      let next = Math.floor(Math.random() * proTips.length);
      while (next === current) {
        next = Math.floor(Math.random() * proTips.length);
      }
      return next;
    });
  }

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
      await navigate({ to: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
            <img src="/favicon.ico" alt="" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">FitStudy</p>
            <p className="text-xs text-slate-500">Slimme studiepartner</p>
          </div>
        </div>

        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Centraal
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === currentPath;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  rotateTip();
                  if (item.path) navigate({ to: item.path });
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.label === "Notities" && unreadNoteCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                    {unreadNoteCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Inzichten
        </p>
        <nav className="space-y-1">
          {insightItems.map((item) => {
            const isActive = item.path === currentPath;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  rotateTip();
                  if (item.path) navigate({ to: item.path });
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-xl bg-blue-600 p-4 text-white">
            <p className="mb-1 text-sm font-semibold">Pro tip</p>
            <p className="text-xs leading-5 text-blue-100">{proTips[tipIndex]}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <LogoutIcon />
            {isSigningOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {celebrating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCelebrating(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Achievement behaald!
            </p>
            <img
              src={ACHIEVEMENT_DEFINITIONS[celebrating.key].badge}
              alt={ACHIEVEMENT_DEFINITIONS[celebrating.key].title}
              className="mx-auto mb-4 h-28 w-28 object-contain"
            />
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              {ACHIEVEMENT_DEFINITIONS[celebrating.key].title}
            </h3>
            <p className="mb-2 text-sm text-slate-500">
              {ACHIEVEMENT_DEFINITIONS[celebrating.key].description}
            </p>
            <p
              className={`mb-6 text-xs font-semibold uppercase ${
                RARITY_META[ACHIEVEMENT_DEFINITIONS[celebrating.key].rarity].color
              }`}
            >
              {RARITY_META[ACHIEVEMENT_DEFINITIONS[celebrating.key].rarity].label}
            </p>
            <button
              type="button"
              onClick={() => setCelebrating(null)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Gaaf!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
