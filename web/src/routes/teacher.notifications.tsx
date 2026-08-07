import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  getTeacherNotes,
  getTeacherTasks,
  getWellbeingAlerts,
  type TeacherNote,
  type TeacherTask,
  type WellbeingAlert,
} from '@/lib/api'

export const Route = createFileRoute('/teacher/notifications')({
  component: TeacherNotificationsPage,
})

// ============================================================================
// MOCKDATA — wordt ALLEEN gebruikt als de echte API-aanroep hieronder faalt
// (bijv. geen database aangesloten). Zodra de koppeling met de backend werkt,
// komt er altijd echte data terug en wordt dit blok nooit gebruikt.
// Veilig om te verwijderen zodra je dit niet meer nodig hebt.
// ============================================================================
const MOCK_ALERTS: WellbeingAlert[] = [
  { id: 'mock-a1', studentId: 'mock-3', studentName: 'Sofia Petrov', level: 8, focus: 4, notes: 'Voelt zich overweldigd door deadlines', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'mock-a2', studentId: 'mock-5', studentName: 'Yuki Tanaka', level: 8, focus: 3, notes: 'Noemde slaaptekort en examenstress', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
]

const now = Date.now()
const MOCK_TASKS: TeacherTask[] = [
  { id: 'mock-t1', userId: 'mock-3', studentName: 'Sofia Petrov', title: 'Labverslag Concept', description: null, deadline: new Date(now - 2 * 24 * 3600 * 1000).toISOString(), status: 'ONGOING', priority: 'HIGH', createdAt: '', updatedAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString() },
  { id: 'mock-t3', userId: 'mock-1', studentName: 'Amara Osei', title: 'Hoofdstuk 5 Overzicht', description: null, deadline: new Date(now - 4 * 3600 * 1000).toISOString(), status: 'COMPLETED', priority: 'MEDIUM', createdAt: '', updatedAt: new Date(now - 4 * 3600 * 1000).toISOString() },
  { id: 'mock-t5', userId: 'mock-2', studentName: 'Liam Nguyen', title: 'Oefentoets Hoofdstuk 3', description: null, deadline: new Date(now - 4 * 24 * 3600 * 1000).toISOString(), status: 'INCOMPLETE', priority: 'MEDIUM', createdAt: '', updatedAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString() },
]

const MOCK_NOTES: TeacherNote[] = [
  { id: 'mock-n2', teacherId: 'mock', studentId: 'mock-5', studentName: 'Yuki Tanaka', category: 'ACHIEVEMENT', content: 'Toonde uitstekend begrip van celbiologie.', createdAt: new Date(now - 26 * 3600 * 1000).toISOString(), updatedAt: new Date(now - 26 * 3600 * 1000).toISOString() },
]
// ============================================================================
// EINDE MOCKDATA
// ============================================================================

type FeedItem = {
  id: string
  icon: string
  iconBg: string
  text: string
  timestamp: string
  isToday: boolean
  isThisWeek: boolean
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'zojuist'
  if (diffMin < 60) return `${diffMin} min geleden`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}u geleden`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'gisteren'
  return `${diffDays} dagen geleden`
}

const CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: 'Academisch',
  WELLBEING: 'Welzijn',
  FOLLOWUP: 'Opvolging Nodig',
  ACHIEVEMENT: 'Prestatie',
}

function buildFeed(alerts: WellbeingAlert[], tasks: TeacherTask[], notes: TeacherNote[]): FeedItem[] {
  const items: FeedItem[] = []
  const dayMs = 24 * 3600 * 1000

  alerts.forEach((alert) => {
    const ts = alert.createdAt
    items.push({
      id: `alert-${alert.id}`,
      icon: '⚠️',
      iconBg: 'bg-rose-50',
      text: `Nieuwe stressmelding: ${alert.studentName} (${alert.level}/10)`,
      timestamp: ts,
      isToday: Date.now() - new Date(ts).getTime() < dayMs,
      isThisWeek: Date.now() - new Date(ts).getTime() < 7 * dayMs,
    })
  })

  tasks.forEach((task) => {
    if (task.status === 'COMPLETED') {
      items.push({
        id: `submitted-${task.id}`,
        icon: '📄',
        iconBg: 'bg-emerald-50',
        text: `${task.studentName} heeft "${task.title}" ingeleverd`,
        timestamp: task.updatedAt,
        isToday: Date.now() - new Date(task.updatedAt).getTime() < dayMs,
        isThisWeek: Date.now() - new Date(task.updatedAt).getTime() < 7 * dayMs,
      })
    } else if (task.deadline && new Date(task.deadline).getTime() < Date.now() && task.status !== 'CANCELED') {
      items.push({
        id: `overdue-${task.id}`,
        icon: '⏰',
        iconBg: 'bg-amber-50',
        text: `"${task.title}" is achterstallig (${task.studentName})`,
        timestamp: task.deadline,
        isToday: Date.now() - new Date(task.deadline).getTime() < dayMs,
        isThisWeek: Date.now() - new Date(task.deadline).getTime() < 7 * dayMs,
      })
    }
  })

  notes.forEach((note) => {
    items.push({
      id: `note-${note.id}`,
      icon: '📝',
      iconBg: 'bg-blue-50',
      text: `Nieuwe notitie (${CATEGORY_LABELS[note.category] ?? note.category}) over ${note.studentName}`,
      timestamp: note.createdAt,
      isToday: Date.now() - new Date(note.createdAt).getTime() < dayMs,
      isThisWeek: Date.now() - new Date(note.createdAt).getTime() < 7 * dayMs,
    })
  })

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function TeacherNotificationsPage() {
  const [alerts, setAlerts] = useState<WellbeingAlert[]>([])
  const [tasks, setTasks] = useState<TeacherTask[]>([])
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  async function loadNotifications() {
    try {
      setIsLoading(true)
      const [alertsData, tasksData, notesData] = await Promise.all([
        getWellbeingAlerts(),
        getTeacherTasks(),
        getTeacherNotes(),
      ])
      setAlerts(alertsData.alerts)
      setTasks(tasksData)
      setNotes(notesData)
      setUsingMockData(false)
    } catch {
      // Val terug op mockdata zodat het ontwerp altijd zichtbaar is, ook zonder database.
      setAlerts(MOCK_ALERTS)
      setTasks(MOCK_TASKS)
      setNotes(MOCK_NOTES)
      setUsingMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const feed = useMemo(() => buildFeed(alerts, tasks, notes), [alerts, tasks, notes])
  const todayItems = feed.filter((f) => f.isToday)
  const weekItems = feed.filter((f) => !f.isToday && f.isThisWeek)
  const olderItems = feed.filter((f) => !f.isThisWeek)
  const unreadCount = feed.filter((f) => !readIds.has(f.id)).length

  function markAllRead() {
    setReadIds(new Set(feed.map((f) => f.id)))
  }

  function markRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id))
  }

  function renderGroup(title: string, items: FeedItem[]) {
    if (items.length === 0) return null
    return (
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-4 first:mt-0">{title}</p>
        <div className="space-y-1">
          {items.map((item) => {
            const isRead = readIds.has(item.id)
            return (
              <div
                key={item.id}
                onClick={() => markRead(item.id)}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isRead ? 'opacity-60' : 'bg-slate-50/60 hover:bg-slate-50'}`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${item.iconBg}`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{item.text}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatRelativeTime(item.timestamp)}</p>
                </div>
                {!isRead && <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Meldingen worden geladen...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">

      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
          Voorbeeldmodus: dit zijn voorbeeldgegevens omdat er nog geen database is aangesloten. Zodra de API werkt, wordt dit automatisch echte data.
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meldingen</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} ongelezen</p>
        </div>
        <button onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:underline">
          Alles als gelezen markeren
        </button>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 max-w-2xl">
        {feed.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Geen meldingen.</p>}
        {renderGroup('Vandaag', todayItems)}
        {renderGroup('Deze week', weekItems)}
        {renderGroup('Eerder', olderItems)}
      </div>

      <p className="text-[11px] text-slate-400 max-w-2xl">
        Deze meldingen worden nu client-side samengesteld uit welzijnsmeldingen, opdrachtstatussen en notities.
        Voor een volwaardig meldingensysteem met "gelezen"-status die bewaard blijft, is een eigen <code>Notification</code>-type
        en endpoint op de backend nodig (naast de bestaande, nog ongetypeerde <code>getNotifications()</code>).
      </p>
    </div>
  )
}
