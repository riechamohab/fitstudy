import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  broadcastTask,
  getTeacherStudents,
  getTeacherTasks,
  type TeacherStudent,
  type TeacherTask,
} from '@/lib/api'

export const Route = createFileRoute('/teacher/assignments')({
  component: TeacherAssignmentsPage,
})

// ============================================================================
// MOCKDATA — wordt ALLEEN gebruikt als de echte API-aanroep hieronder faalt
// (bijv. geen database aangesloten). Zodra de koppeling met de backend werkt,
// komt er altijd echte data terug en wordt dit blok nooit gebruikt.
// Veilig om te verwijderen zodra je dit niet meer nodig hebt.
// ============================================================================
const MOCK_STUDENTS: TeacherStudent[] = [
  { id: 'mock-1', name: 'Amara Osei', email: 'amara@example.com', studentClass: 'Periode 1 — Biologie', createdAt: '', counts: { tasks: 4, exercises: 0, stressLevels: 3 }, completedTasks: 4, overdueTasks: 0, currentTask: null, currentTaskStatus: null, recentStressLevel: 2, completionRate: 92 },
  { id: 'mock-2', name: 'Liam Nguyen', email: 'liam@example.com', studentClass: 'Periode 3 — Wiskunde', createdAt: '', counts: { tasks: 6, exercises: 0, stressLevels: 5 }, completedTasks: 4, overdueTasks: 0, currentTask: null, currentTaskStatus: null, recentStressLevel: 5, completionRate: 67 },
  { id: 'mock-3', name: 'Sofia Petrov', email: 'sofia@example.com', studentClass: 'Periode 1 — Biologie', createdAt: '', counts: { tasks: 5, exercises: 0, stressLevels: 4 }, completedTasks: 2, overdueTasks: 1, currentTask: null, currentTaskStatus: null, recentStressLevel: 8, completionRate: 45 },
]

const now = Date.now()
const MOCK_TASKS: TeacherTask[] = [
  { id: 'mock-t1', userId: 'mock-3', studentName: 'Sofia Petrov', title: 'Labverslag Concept', description: 'Eerste concept van het labverslag over celbiologie.', deadline: new Date(now - 2 * 24 * 3600 * 1000).toISOString(), status: 'ONGOING', priority: 'HIGH', createdAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString() },
  { id: 'mock-t2', userId: 'mock-2', studentName: 'Liam Nguyen', title: 'Wiskundeopgaven Set', description: 'Hoofdstuk 4, opgaven 1 t/m 20.', deadline: new Date(now + 2 * 24 * 3600 * 1000).toISOString(), status: 'ONGOING', priority: 'MEDIUM', createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString() },
  { id: 'mock-t3', userId: 'mock-1', studentName: 'Amara Osei', title: 'Hoofdstuk 5 Overzicht', description: 'Samenvatting van hoofdstuk 5.', deadline: new Date(now - 1 * 24 * 3600 * 1000).toISOString(), status: 'COMPLETED', priority: 'MEDIUM', createdAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString() },
  { id: 'mock-t4', userId: 'mock-3', studentName: 'Sofia Petrov', title: 'Presentatie Voorbereiding', description: null, deadline: new Date(now + 5 * 24 * 3600 * 1000).toISOString(), status: 'ONGOING', priority: 'LOW', createdAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString() },
  { id: 'mock-t5', userId: 'mock-2', studentName: 'Liam Nguyen', title: 'Oefentoets Hoofdstuk 3', description: null, deadline: new Date(now - 4 * 24 * 3600 * 1000).toISOString(), status: 'INCOMPLETE', priority: 'MEDIUM', createdAt: new Date(now - 9 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString() },
]
// ============================================================================
// EINDE MOCKDATA
// ============================================================================

const STATUS_LABELS: Record<string, string> = {
  ONGOING: 'Bezig',
  COMPLETED: 'Voltooid',
  INCOMPLETE: 'Niet Afgemaakt',
  CANCELED: 'Geannuleerd',
}

const STATUS_BADGE: Record<string, string> = {
  ONGOING: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  INCOMPLETE: 'bg-amber-50 text-amber-700',
  CANCELED: 'bg-slate-100 text-slate-500',
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-rose-50 text-rose-700',
  MEDIUM: 'bg-slate-100 text-slate-600',
  LOW: 'bg-slate-100 text-slate-400',
}

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'Hoog',
  MEDIUM: 'Normaal',
  LOW: 'Laag',
}

function isOverdue(task: TeacherTask): boolean {
  if (!task.deadline) return false
  if (task.status === 'COMPLETED' || task.status === 'CANCELED') return false
  return new Date(task.deadline).getTime() < Date.now()
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function initials(name: string): string {
  return name.split(' ').map((part) => part.charAt(0)).slice(0, 2).join('').toUpperCase()
}

type StatusFilter = 'all' | 'ONGOING' | 'COMPLETED' | 'INCOMPLETE' | 'CANCELED' | 'OVERDUE'

function TeacherAssignmentsPage() {
  const [tasks, setTasks] = useState<TeacherTask[]>([])
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [assignTo, setAssignTo] = useState('all')
  const [isAssigning, setIsAssigning] = useState(false)
  const [taskFeedback, setTaskFeedback] = useState('')

  async function loadAssignments() {
    try {
      setIsLoading(true)
      const [tasksData, studentsData] = await Promise.all([getTeacherTasks(), getTeacherStudents()])
      setTasks(tasksData)
      setStudents(studentsData)
      setUsingMockData(false)
    } catch {
      // Val terug op mockdata zodat het ontwerp altijd zichtbaar is, ook zonder database.
      setTasks(MOCK_TASKS)
      setStudents(MOCK_STUDENTS)
      setUsingMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  const uniqueClasses: string[] = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s: TeacherStudent) => { if (s.studentClass) set.add(s.studentClass) })
    return Array.from(set)
  }, [students])

  const counts = useMemo(() => ({
    all: tasks.length,
    ONGOING: tasks.filter((t) => t.status === 'ONGOING').length,
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED').length,
    INCOMPLETE: tasks.filter((t) => t.status === 'INCOMPLETE').length,
    CANCELED: tasks.filter((t) => t.status === 'CANCELED').length,
    OVERDUE: tasks.filter(isOverdue).length,
  }), [tasks])

  const filteredTasks: TeacherTask[] = useMemo(() => {
    if (statusFilter === 'all') return tasks
    if (statusFilter === 'OVERDUE') return tasks.filter(isOverdue)
    return tasks.filter((t) => t.status === statusFilter)
  }, [tasks, statusFilter])

  async function handleAssignTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle) return

    if (usingMockData) {
      setTaskFeedback('Voorbeeldmodus: opdracht wordt niet echt opgeslagen zonder database.')
      setTaskTitle('')
      setTaskDescription('')
      setTaskDeadline('')
      return
    }

    try {
      setIsAssigning(true)
      setTaskFeedback('')
      const result = await broadcastTask({
        title: taskTitle,
        description: taskDescription || undefined,
        deadline: taskDeadline || undefined,
        studentClass: assignTo === 'all' ? undefined : assignTo,
      })
      setTaskFeedback(`Opdracht toegewezen aan ${result.assignedCount} studenten.`)
      setTaskTitle('')
      setTaskDescription('')
      setTaskDeadline('')
      const tasksData = await getTeacherTasks()
      setTasks(tasksData)
    } catch (error) {
      setTaskFeedback(error instanceof Error ? error.message : 'Toewijzen van opdracht mislukt')
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Opdrachten worden geladen...</p>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Opdrachten</h1>
          <p className="text-sm text-slate-500 mt-0.5">{counts.all} opdrachten uitgezet, {counts.COMPLETED} voltooid</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
          <h2 className="text-base font-bold text-slate-900 mb-3">Alle Opdrachten</h2>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {([
              ['all', `Alle (${counts.all})`],
              ['ONGOING', `Bezig (${counts.ONGOING})`],
              ['COMPLETED', `Voltooid (${counts.COMPLETED})`],
              ['OVERDUE', `Achterstand (${counts.OVERDUE})`],
              ['INCOMPLETE', `Niet Afgemaakt (${counts.INCOMPLETE})`],
              ['CANCELED', `Geannuleerd (${counts.CANCELED})`],
            ] as [StatusFilter, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-2 px-2">Opdracht</th>
                  <th className="p-2">Student</th>
                  <th className="p-2">Deadline</th>
                  <th className="p-2">Prioriteit</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTasks.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-sm">Geen opdrachten gevonden.</td></tr>
                )}
                {filteredTasks.map((task: TeacherTask) => {
                  const overdue = isOverdue(task)
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-2 px-2">
                        <p className="font-semibold text-slate-800 leading-tight">{task.title}</p>
                        {task.description && <p className="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{task.description}</p>}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {initials(task.studentName)}
                          </div>
                          <span className="text-slate-600">{task.studentName}</span>
                        </div>
                      </td>
                      <td className={`p-2 ${overdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>{formatDate(task.deadline)}</td>
                      <td className="p-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.MEDIUM}`}>
                          {PRIORITY_LABELS[task.priority] ?? task.priority}
                        </span>
                      </td>
                      <td className="p-2">
                        {overdue ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Achterstand</span>
                        ) : (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[task.status] ?? STATUS_BADGE.ONGOING}`}>
                            {STATUS_LABELS[task.status] ?? task.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 h-fit">
          <h2 className="text-base font-bold text-slate-900">Nieuwe Opdracht</h2>
          <p className="text-xs text-slate-400 mb-4">Stuur een opdracht naar een hele klas.</p>

          <form onSubmit={handleAssignTask} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Titel</label>
              <Input
                placeholder="bijv. Hoofdstuk 6 Toets"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="bg-slate-50 border-slate-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Beschrijving</label>
              <Textarea
                placeholder="Optionele toelichting..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="bg-slate-50 border-slate-200 rounded-lg min-h-[70px] text-sm"
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
              {isAssigning ? 'Bezig...' : 'Opdracht Versturen'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
