import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { signOut } from "../lib/api";

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

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3h-4l-.3 2.5a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1L11 21h4l.3-2.5a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z" />
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
  { 
    label: "Dashboard", 
    icon: DashboardIcon, 
    path: "/student-dashboard" 
  },

  { 
    label: "Planner", 
    icon: PlannerIcon, 
    path: "/student-planner" 
  },

  { 
    label: "Rooster & Programma", 
    icon: CoursesIcon, 
    path: "/student-courses" 
  },

  { 
    label: "Focus Timer", 
    icon: FocusTimerIcon, 
    path: "/focus-timer" as const 
  },

  { 
    label: "Notities", 
    icon: NotesIcon, 
    path: "/student-notes" 
  },
];

const insightItems = [
  { label: "Progress", icon: ProgressIcon, path: "/student-progress" as const },
  { label: "Wellbeing", icon: WellbeingIcon, path: "/student-welzijn" },
  { label: "Achievements", icon: AchievementsIcon, path: undefined },
];

function AppLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [tipIndex, setTipIndex] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * proTips.length));
  }, []);

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
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
            <img src="/favicon.ico" alt="" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">FitStudy</p>
            <p className="text-xs text-slate-500">Smart study companion</p>
          </div>
        </div>

        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Main
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
                {item.label}
              </button>
            );
          })}
        </nav>

        <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Insights
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
            onClick={() => navigate({ to: "/student-profile-settings" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <SettingsIcon />
            Settings
          </button>

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
    </div>
  );
}
