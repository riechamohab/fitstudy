import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getProfile, signOut, type UserProfile } from '@/lib/api'

export const Route = createFileRoute('/teacher')({
  component: TeacherLayout,
})

function HeartIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2 4.5 5.6 4c2-.3 3.9.6 5 2.2C11.7 4.6 13.6 3.7 15.6 4c3.6.5 5.2 4.2 3.6 7.7C19.5 16.4 12 21 12 21Z" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="12" width="8" height="9" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
    </svg>
  )
}

function StudentsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14c2.8.3 4.5 2.2 4.5 5" />
    </svg>
  )
}

function AssignmentsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}

function StressIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.5 2.8c0 5.6-7.5 10.2-7.5 10.2Z" />
    </svg>
  )
}

function NotificationsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3h-4l-.3 2.5a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1L11 21h4l.3-2.5a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

const navItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/teacher' as const, badge: null as number | null },
  { label: 'Studenten', icon: StudentsIcon, path: '/teacher/students' as const, badge: null as number | null },
  { label: 'Opdrachten', icon: AssignmentsIcon, path: '/teacher/assignments' as const, badge: null as number | null },
  { label: 'Stressmonitor', icon: StressIcon, path: '/teacher/stress-monitor' as const, badge: null as number | null },
  { label: 'Meldingen', icon: NotificationsIcon, path: '/teacher/notifications' as const, badge: 3 as number | null },
]

function TeacherLayout() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const [teacherProfile, setTeacherProfile] = useState<UserProfile | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    getProfile()
      .then(setTeacherProfile)
      .catch(() => {
        // Niet ingelogd of API niet bereikbaar — de pagina's eronder tonen zelf een foutmelding of mockdata.
      })
  }, [])

  async function handleLogout() {
    setIsSigningOut(true)
    try {
      await signOut()
      await navigate({ to: '/login' })
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">

      {/* VASTE ZIJBALK — blijft altijd zichtbaar, alleen de inhoud rechts verandert */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-5">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <HeartIcon />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">FitStudy</p>
          </div>
        </div>

        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Hoofdmenu</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === currentPath
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate({ to: item.path })}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon />
                  {item.label}
                </span>
                {item.badge !== null && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <button
            type="button"
            onClick={() => navigate({ to: '/profile-settings' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <SettingsIcon />
            Instellingen
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <LogoutIcon />
            {isSigningOut ? 'Bezig met uitloggen...' : 'Uitloggen'}
          </button>

          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border-t border-slate-100 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {(teacherProfile?.name ?? 'D').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{teacherProfile?.name ?? 'Docent'}</p>
              <p className="text-xs text-slate-500 truncate">{teacherProfile?.school ?? 'Docentenaccount'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* PAGINA-INHOUD */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
