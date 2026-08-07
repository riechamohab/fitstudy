import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  broadcastTask,
  createTeacherNote,
  deleteTeacherNote,
  getTeacherNotes,
  getTeacherOverview,
  getTeacherStudents,
  getWellbeingAlerts,
  type NoteCategory,
  type TeacherNote,
  type TeacherOverview,
  type TeacherStudent,
  type WellbeingAlert,
} from '@/lib/api'

export const Route = createFileRoute('/teacher/')({
  component: TeacherDashboardIndex,
})

// ============================================================================
// MOCKDATA — wordt ALLEEN gebruikt als de echte API-aanroep hieronder faalt
// (bijv. geen database aangesloten). Zodra de koppeling met de backend werkt,
// komt er altijd echte data terug en wordt dit blok nooit gebruikt.
// Veilig om te verwijderen zodra je dit niet meer nodig hebt.
// ============================================================================
const MOCK_OVERVIEW: TeacherOverview = {
  totalStudents: 24,
  activeStudents: 24,
  totalTasks: 40,
  completedTasks: 31,
  avgCompletionRate: 78,
}

const MOCK_STUDENTS: TeacherStudent[] = [
  {
    id: 'mock-1', name: 'Amara Osei', email: 'amara@example.com', studentClass: 'Periode 1 — Biologie',
    createdAt: '', counts: { tasks: 4, exercises: 0, stressLevels: 3 }, completedTasks: 4, overdueTasks: 0,
    currentTask: 'Hoofdstuk 5 Overzicht', currentTaskStatus: 'Ingeleverd', recentStressLevel: 2, completionRate: 92,
  },
  {
    id: 'mock-2', name: 'Liam Nguyen', email: 'liam@example.com', studentClass: 'Periode 3 — Wiskunde',
    createdAt: '', counts: { tasks: 6, exercises: 0, stressLevels: 5 }, completedTasks: 4, overdueTasks: 0,
    currentTask: 'Wiskundeopgaven Set', currentTaskStatus: 'Bezig', recentStressLevel: 5, completionRate: 67,
  },
  {
    id: 'mock-3', name: 'Sofia Petrov', email: 'sofia@example.com', studentClass: 'Periode 1 — Biologie',
    createdAt: '', counts: { tasks: 5, exercises: 0, stressLevels: 4 }, completedTasks: 2, overdueTasks: 1,
    currentTask: 'Labverslag Concept', currentTaskStatus: 'Achterstand', recentStressLevel: 8, completionRate: 45,
  },
  {
    id: 'mock-4', name: 'Marcus Reid', email: 'marcus@example.com', studentClass: 'Periode 5 — Engels',
    createdAt: '', counts: { tasks: 5, exercises: 0, stressLevels: 3 }, completedTasks: 4, overdueTasks: 0,
    currentTask: 'Opzet Essay', currentTaskStatus: 'Ingeleverd', recentStressLevel: 2, completionRate: 88,
  },
  {
    id: 'mock-5', name: 'Yuki Tanaka', email: 'yuki@example.com', studentClass: 'Periode 3 — Wiskunde',
    createdAt: '', counts: { tasks: 4, exercises: 0, stressLevels: 4 }, completedTasks: 1, overdueTasks: 1,
    currentTask: 'Presentatie Voorbereiding', currentTaskStatus: 'Achterstand', recentStressLevel: 8, completionRate: 30,
  },
  {
    id: 'mock-6', name: 'Chloe Martin', email: 'chloe@example.com', studentClass: 'Periode 5 — Engels',
    createdAt: '', counts: { tasks: 4, exercises: 0, stressLevels: 3 }, completedTasks: 3, overdueTasks: 0,
    currentTask: 'Samenvatting Leesboek', currentTaskStatus: 'Bezig', recentStressLevel: 5, completionRate: 75,
  },
  {
    id: 'mock-7', name: 'Devon Blake', email: 'devon@example.com', studentClass: 'Periode 1 — Biologie',
    createdAt: '', counts: { tasks: 4, exercises: 0, stressLevels: 2 }, completedTasks: 4, overdueTasks: 0,
    currentTask: 'Hoofdstuk 5 Overzicht', currentTaskStatus: 'Voltooid', recentStressLevel: 2, completionRate: 100,
  },
]

const MOCK_ALERTS: WellbeingAlert[] = [
  {
    id: 'mock-a1', studentId: 'mock-3', studentName: 'Sofia Petrov', level: 8, focus: 4,
    notes: 'Voelt zich overweldigd door deadlines', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-a2', studentId: 'mock-5', studentName: 'Yuki Tanaka', level: 8, focus: 3,
    notes: 'Noemde slaaptekort en examenstress', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
]

const MOCK_NOTES: TeacherNote[] = [
  {
    id: 'mock-n1', teacherId: 'mock', studentId: 'mock-3', studentName: 'Sofia Petrov', category: 'FOLLOWUP',
    content: 'Worstelt met de structuur van het labverslag. Plan deze week een 1-op-1 spreekuur. Lijkt gespannen over het aankomende examen.',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-n2', teacherId: 'mock', studentId: 'mock-5', studentName: 'Yuki Tanaka', category: 'ACHIEVEMENT',
    content: 'Toonde uitstekend begrip van celbiologie tijdens klassikale discussie — overweeg nominatie voor de wetenschapsbeurs.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-n3', teacherId: 'mock', studentId: 'mock-2', studentName: 'Liam Nguyen', category: 'ACADEMIC',
    content: 'Twee opdrachten deze week gemist. Contact met ouders kan nodig zijn. Informeer privé naar de thuissituatie.',
    createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), updatedAt: new Date().toISOString(),
  },
]
// ============================================================================
// EINDE MOCKDATA
// ============================================================================

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  ACADEMIC: 'Academisch',
  WELLBEING: 'Welzijn',
  FOLLOWUP: 'Opvolging Nodig',
  ACHIEVEMENT: 'Prestatie',
}

const CATEGORY_BADGE: Record<NoteCategory, string> = {
  ACADEMIC: 'bg-blue-50 text-blue-700',
  WELLBEING: 'bg-rose-50 text-rose-700',
  FOLLOWUP: 'bg-amber-50 text-amber-700',
  ACHIEVEMENT: 'bg-emerald-50 text-emerald-700',
}

function stressDot(level: number | null): { label: string; dot: string; text: string } {
  if (level === null) return { label: 'Onbekend', dot: 'bg-slate-400', text: 'text-slate-500' }
  if (level >= 7) return { label: 'Hoog', dot: 'bg-rose-500', text: 'text-rose-600' }
  if (level >= 4) return { label: 'Gemiddeld', dot: 'bg-amber-500', text: 'text-amber-600' }
  return { label: 'Laag', dot: 'bg-emerald-500', text: 'text-emerald-600' }
}

function initials(name: string): string {
  return name.split(' ').map((part) => part.charAt(0)).slice(0, 2).join('').toUpperCase()
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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function TeacherDashboardIndex() {
  const [overview, setOverview] = useState<TeacherOverview | null>(null)
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [alerts, setAlerts] = useState<WellbeingAlert[]>([])
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  const [levelFilter, setLevelFilter] = useState('all')

  const [selectedStudent, setSelectedStudent] = useState('')
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('ACADEMIC')
  const [noteContent, setNoteContent] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [assignTo, setAssignTo] = useState('all')
  const [isAssigning, setIsAssigning] = useState(false)
  const [taskFeedback, setTaskFeedback] = useState('')

  async function loadDashboard() {
    try {
      setIsLoading(true)
      const [overviewData, studentsData, alertsData, notesData] = await Promise.all([
        getTeacherOverview(),
        getTeacherStudents(),
        getWellbeingAlerts(),
        getTeacherNotes(),
      ])
      setOverview(overviewData)
      setStudents(studentsData)
      setAlerts(alertsData.alerts)
      setNotes(notesData)
      setUsingMockData(false)
    } catch {
      // Val terug op mockdata zodat het ontwerp altijd zichtbaar is, ook zonder database.
      setOverview(MOCK_OVERVIEW)
      setStudents(MOCK_STUDENTS)
      setAlerts(MOCK_ALERTS)
      setNotes(MOCK_NOTES)
      setUsingMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const uniqueClasses: string[] = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s: TeacherStudent) => { if (s.studentClass) set.add(s.studentClass) })
    return Array.from(set)
  }, [students])

  const filteredStudents: TeacherStudent[] = useMemo(() => {
    return students.filter((student: TeacherStudent) => {
      const level = student.recentStressLevel
      if (levelFilter === 'all') return true
      if (levelFilter === 'high') return (level ?? 0) >= 7
      if (levelFilter === 'medium') return (level ?? 0) >= 4 && (level ?? 0) < 7
      if (levelFilter === 'low') return level !== null && level < 4
      return true
    })
  }, [students, levelFilter])

  const attentionCount: number = useMemo(
    () => students.filter((s: TeacherStudent) => s.overdueTasks > 0 || (s.recentStressLevel ?? 0) >= 7).length,
    [students]
  )

  const avgStress: number | null = useMemo(() => {
    const withStress = students.filter((s: TeacherStudent) => s.recentStressLevel !== null)
    if (withStress.length === 0) return null
    const sum = withStress.reduce((total: number, s: TeacherStudent) => total + (s.recentStressLevel ?? 0), 0)
    return Number((sum / withStress.length).toFixed(1))
  }, [students])

  function handleAddNoteFor(studentId: string) {
    setSelectedStudent(studentId)
    document.getElementById('notes-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudent || !noteContent || usingMockData) return
    try {
      setIsSavingNote(true)
      const created = await createTeacherNote({ studentId: selectedStudent, category: noteCategory, content: noteContent })
      setNotes([created, ...notes])
      setNoteContent('')
    } catch {
      // stil falen, de gebruiker ziet de state niet veranderen
    } finally {
      setIsSavingNote(false)
    }
  }

  async function handleDeleteNote(id: string) {
    if (usingMockData) {
      setNotes(notes.filter((note: TeacherNote) => note.id !== id))
      return
    }
    try {
      await deleteTeacherNote(id)
      setNotes(notes.filter((note: TeacherNote) => note.id !== id))
    } catch {
      // stil falen
    }
  }

  async function handleAssignTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle) return

    if (usingMockData) {
      setTaskFeedback('Voorbeeldmodus: opdracht wordt niet echt opgeslagen zonder database.')
      setTaskTitle('')
      setTaskDeadline('')
      return
    }

    try {
      setIsAssigning(true)
      setTaskFeedback('')
      const result = await broadcastTask({ title: taskTitle, deadline: taskDeadline || undefined, studentClass: assignTo })
      setTaskFeedback(`Opdracht toegewezen aan ${result.assignedCount} studenten.`)
      setTaskTitle('')
      setTaskDeadline('')
      const overviewData = await getTeacherOverview()
      setOverview(overviewData)
    } catch (error) {
      setTaskFeedback(error instanceof Error ? error.message : 'Toewijzen van opdracht mislukt')
    } finally {
      setIsAssigning(false)
    }
  }

  const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Dashboard wordt geladen...</p>
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

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welkom terug, Professor 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <Input placeholder="Zoek studenten of taken..." className="w-64 bg-white border-slate-200 text-sm" />
        </div>
      </header>

      {/* STATISTIEKEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Totaal Actieve Studenten</span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">👥</div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{overview?.totalStudents ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Alle periodes gecombineerd</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">+2 deze week</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Gem. Stressniveau</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">🤍</div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{avgStress ?? '–'} <span className="text-base font-normal text-slate-400">/ 10</span></p>
          <p className="text-xs text-slate-400 mt-1">Laag — gezond bereik</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">▼ Verbetert</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Voltooiingspercentage</span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">📋</div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{overview?.avgCompletionRate ?? 0}%</p>
          <p className="text-xs text-slate-400 mt-1">Opdracht inzendingen</p>
          <p className="text-xs text-blue-600 font-medium mt-1">+4% t.o.v. vorige week</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Aandacht Vereist</span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">⚠️</div>
          </div>
          <p className="text-3xl font-bold text-rose-600 mt-3">{attentionCount}</p>
          <p className="text-xs text-slate-400 mt-1">Studenten vandaag gemarkeerd</p>
          <p className="text-xs text-rose-600 font-medium mt-1">Actie vereist</p>
        </div>
      </div>

      {/* HOOFDGRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* STUDENTENTABEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
            <h2 className="text-base font-bold text-slate-900">Studenten Voortgang & Welzijn</h2>
            <button className="text-xs font-semibold text-blue-600 hover:underline">Exporteer CSV</button>
          </div>
          <p className="text-xs text-slate-400 mb-4">{filteredStudents.length} van {students.length} studenten</p>

          <div className="flex items-center gap-2 mb-4">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
            >
              <option value="all">Alle Niveaus</option>
              <option value="high">Hoge Stress</option>
              <option value="medium">Gemiddelde Stress</option>
              <option value="low">Lage Stress</option>
            </select>
            <select className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 outline-none">
              <option>Alle Klassen</option>
              {uniqueClasses.map((c: string) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-2 px-2">Student</th>
                  <th className="p-2">Huidige Taak</th>
                  <th className="p-2">Voortgang</th>
                  <th className="p-2">Stress</th>
                  <th className="p-2 text-right pr-2">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-sm">Geen studenten gevonden.</td></tr>
                )}
                {filteredStudents.map((student: TeacherStudent) => {
                  const stress = stressDot(student.recentStressLevel)
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-2 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {initials(student.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{student.name}</p>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              {student.studentClass ?? '—'}{student.currentTaskStatus ? ` · ${student.currentTaskStatus}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-slate-600">{student.currentTask ?? '—'}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${student.completionRate}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500">{student.completionRate}%</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${stress.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${stress.dot}`}></span>
                          {stress.label}
                        </span>
                      </td>
                      <td className="p-2 text-right pr-2">
                        <button
                          onClick={() => handleAddNoteFor(student.id)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Bekijk
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ZIJPANEEL */}
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
            <h2 className="text-base font-bold text-slate-900">Snel Opdracht Toewijzen</h2>
            <p className="text-xs text-slate-400 mb-4">Stuur een opdracht naar je klas.</p>

            <form onSubmit={handleAssignTask} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Taak Titel</label>
                <Input
                  placeholder="bijv. Hoofdstuk 6 Toets"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Vervaldatum</label>
                <Input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} className="bg-slate-50 border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Toewijzen aan</label>
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-700"
                >
                  <option value="all">Alle studenten</option>
                  {uniqueClasses.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {taskFeedback && <p className="text-xs text-slate-500">{taskFeedback}</p>}

              <Button
                type="submit"
                disabled={isAssigning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
              >
                {isAssigning ? 'Bezig...' : 'Taak Toewijzen'}
              </Button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold text-slate-900">Welzijnsmeldingen</h2>
                <p className="text-xs text-slate-400">Hoge stressmeldingen vandaag</p>
              </div>
              {alerts.length > 0 && (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full whitespace-nowrap">
                  {alerts.length} gemeld
                </span>
              )}
            </div>

            <div className="space-y-3 mt-4">
              {alerts.length === 0 && <p className="text-sm text-slate-400">Geen meldingen.</p>}
              {alerts.map((alert: WellbeingAlert) => (
                <div key={alert.id} className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center">
                      {initials(alert.studentName)}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{alert.studentName}</p>
                    <span className="text-[11px] text-slate-400 ml-auto">{formatRelativeTime(alert.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{alert.notes || `Stressniveau ${alert.level}/10`}</p>
                  <div className="flex gap-2">
                    <a href={`mailto:?subject=Even%20contact%20over%20${encodeURIComponent(alert.studentName)}`}>
                      <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7 px-3">Contact</Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-3 border-slate-200"
                      onClick={() => handleAddNoteFor(alert.studentId)}
                    >
                      Notitie Toevoegen
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 italic">Gebaseerd op anonieme zelfrapportages via de FitStudy app.</p>
          </div>
        </div>
      </div>

      {/* RECENTE NOTITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div id="notes-form" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 space-y-3 h-fit">
          <h2 className="text-base font-bold text-slate-900">Nieuwe Notitie</h2>
          <form onSubmit={handleSaveNote} className="space-y-3">
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-700"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">Kies een student...</option>
              {students.map((s: TeacherStudent) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-700"
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Textarea
              placeholder="Observatie of feedback..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="bg-slate-50 border-slate-200 rounded-lg min-h-[90px] text-sm"
              required
            />
            <Button type="submit" disabled={isSavingNote} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm">
              {isSavingNote ? 'Bezig...' : 'Notitie Opslaan'}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recente Notities</h2>
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {notes.length === 0 && <p className="text-sm text-slate-400">Nog geen notities.</p>}
            {notes.map((note: TeacherNote) => (
              <div key={note.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                      {initials(note.studentName)}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{note.studentName}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[note.category]}`}>
                      {CATEGORY_LABELS[note.category]}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1.5">{note.content}</p>
                <button onClick={() => handleDeleteNote(note.id)} className="text-[11px] text-slate-400 hover:text-rose-600 font-medium">
                  Verwijderen
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
