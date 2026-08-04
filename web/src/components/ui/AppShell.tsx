import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import type { NavItem } from "../../lib/navigation/studentNav";

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AppShellProps {
  navSections: NavSection[];
  proTips?: string[];
  tipIndex?: number;
  onRotateTip?: () => void;
  onLogout: () => Promise<void>;
  isSigningOut: boolean;
  unreadNoteCount?: number;
}

export function AppShell({
  navSections,
  proTips,
  tipIndex = 0,
  onRotateTip,
  onLogout,
  isSigningOut,
  unreadNoteCount = 0,
}: AppShellProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

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

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx}>
              {section.title && (
                <p className={`mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 ${sIdx > 0 ? "mt-6" : ""}`}>
                  {section.title}
                </p>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.path === currentPath;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onRotateTip?.();
                        if (item.path) navigate({ to: item.path });
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon />
                      <span className="truncate">{item.label}</span>
                      {item.label === "Notities" && unreadNoteCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                          {unreadNoteCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-6 border-t border-slate-100">
          {proTips && proTips.length > 0 && (
            <div className="rounded-xl bg-blue-600 p-4 text-white">
              <p className="mb-1 text-sm font-semibold">Pro tip</p>
              <p className="text-xs leading-5 text-blue-100">{proTips[tipIndex]}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
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