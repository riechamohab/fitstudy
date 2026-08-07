import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createTeacherNote,
  deleteTeacherNote,
  getTeacherNotes,
  getTeacherStudents,
  type NoteCategory,
  type TeacherNote,
  type TeacherStudent,
} from '@/lib/api'

export const Route = createFileRoute('/teacher/students')({
  component: TeacherStudentsPage,
})

// ============================================================================
// MOCKDATA — wordt ALLEEN gebruikt als de echte API-aanroep hieronder faalt
// (bijv. geen database aangesloten). Zodra de koppeling met de backend werkt,
// komt er altijd echte data terug en wordt dit blok nooit gebruikt.
// Veilig om te verwijderen zodra je dit niet meer nodig hebt.
// ============================================================================
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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function TeacherStudentsPage() {
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'stress' | 'progress'>('name')

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('ACADEMIC')
  const [noteContent, setNoteContent] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  async function loadStudents() {
    try {
      setIsLoading(true)
      const [studentsData, notesData] = await Promise.all([getTeacherStudents(), getTeacherNotes()])
      setStudents(studentsData)
      setNotes(notesData)
      setUsingMockData(false)
    } catch {
      // Val terug op mockdata zodat het ontwerp altijd zichtbaar is, ook zonder database.
      setStudents(MOCK_STUDENTS)
      setNotes(MOCK_NOTES)
      setUsingMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const uniqueClasses: string[] = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s: TeacherStudent) => { if (s.studentClass) set.add(s.studentClass) })
    return Array.from(set)
  }, [students])

  const filteredStudents: TeacherStudent[] = useMemo(() => {
    const term = search.trim().toLowerCase()
    return students
      .filter((student: TeacherStudent) => {
        if (term && !student.name.toLowerCase().includes(term) && !student.email.toLowerCase().includes(term)) return false
        if (classFilter !== 'all' && student.studentClass !== classFilter) return false
        const level = student.recentStressLevel
        if (levelFilter === 'high') return (level ?? 0) >= 7
        if (levelFilter === 'medium') return (level ?? 0) >= 4 && (level ?? 0) < 7
        if (levelFilter === 'low') return level !== null && level < 4
        return true
      })
      .sort((a: TeacherStudent, b: TeacherStudent) => {
        if (sortBy === 'stress') return (b.recentStressLevel ?? 0) - (a.recentStressLevel ?? 0)
        if (sortBy === 'progress') return a.completionRate - b.completionRate
        return a.name.localeCompare(b.name)
      })
  }, [students, search, classFilter, levelFilter, sortBy])

  const selectedStudent = useMemo(
    () => students.find((s: TeacherStudent) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  )

  const studentNotes = useMemo(
    () => notes.filter((n: TeacherNote) => n.studentId === selectedStudentId),
    [notes, selectedStudentId]
  )

  function handleSelectStudent(id: string) {
    setSelectedStudentId(id)
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudentId || !noteContent) return

    if (usingMockData) {
      const fakeNote: TeacherNote = {
        id: `mock-${Date.now()}`,
        teacherId: 'mock',
        studentId: selectedStudentId,
        studentName: selectedStudent?.name ?? '',
        category: noteCategory,
        content: noteContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setNotes([fakeNote, ...notes])
      setNoteContent('')
      return
    }

    try {
      setIsSavingNote(true)
      const created = await createTeacherNote({ studentId: selectedStudentId, category: noteCategory, content: noteContent })
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Studenten worden geladen...</p>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Studenten</h1>
          <p className="text-sm text-slate-500 mt-0.5">{students.length} studenten in {uniqueClasses.length} klassen</p>
        </div>
        <Input
          placeholder="Zoek op naam of e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-white border-slate-200 text-sm"
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* STUDENTENTABEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
            <h2 className="text-base font-bold text-slate-900">Alle Studenten</h2>
            <button className="text-xs font-semibold text-blue-600 hover:underline">Exporteer CSV</button>
          </div>
          <p className="text-xs text-slate-400 mb-4">{filteredStudents.length} van {students.length} studenten</p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
            >
              <option value="all">Alle Klassen</option>
              {uniqueClasses.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
            >
              <option value="all">Alle Stressniveaus</option>
              <option value="high">Hoge Stress</option>
              <option value="medium">Gemiddelde Stress</option>
              <option value="low">Lage Stress</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'stress' | 'progress')}
              className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
            >
              <option value="name">Sorteer: Naam</option>
              <option value="stress">Sorteer: Stress</option>
              <option value="progress">Sorteer: Voortgang</option>
            </select>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-2 px-2">Student</th>
                  <th className="p-2">Huidige Taak</th>
                  <th className="p-2">Voortgang</th>
                  <th className="p-2">Achterstand</th>
                  <th className="p-2">Stress</th>
                  <th className="p-2 text-right pr-2">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-sm">Geen studenten gevonden.</td></tr>
                )}
                {filteredStudents.map((student: TeacherStudent) => {
                  const stress = stressDot(student.recentStressLevel)
                  const isActive = student.id === selectedStudentId
                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className={`cursor-pointer transition-colors ${isActive ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="p-2 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {initials(student.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{student.name}</p>
                            <p className="text-[11px] text-slate-400 leading-tight">{student.studentClass ?? '—'}</p>
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
                        {student.overdueTasks > 0 ? (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{student.overdueTasks}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${stress.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${stress.dot}`}></span>
                          {stress.label}
                        </span>
                      </td>
                      <td className="p-2 text-right pr-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectStudent(student.id) }}
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

        {/* DETAILPANEEL */}
        <div className="space-y-5">
          {!selectedStudent && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 text-center">
              <p className="text-sm text-slate-400">Selecteer een student om details en notities te bekijken.</p>
            </div>
          )}

          {selectedStudent && (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                    {initials(selectedStudent.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-400 truncate">{selectedStudent.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Klas</p>
                    <p className="text-slate-700 font-medium mt-0.5">{selectedStudent.studentClass ?? '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Voltooiing</p>
                    <p className="text-slate-700 font-medium mt-0.5">{selectedStudent.completionRate}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Taken</p>
                    <p className="text-slate-700 font-medium mt-0.5">{selectedStudent.completedTasks} / {selectedStudent.counts.tasks}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Achterstand</p>
                    <p className={`font-medium mt-0.5 ${selectedStudent.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{selectedStudent.overdueTasks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 space-y-3">
                <h2 className="text-base font-bold text-slate-900">Nieuwe Notitie</h2>
                <form onSubmit={handleSaveNote} className="space-y-3">
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
                    className="bg-slate-50 border-slate-200 rounded-lg min-h-[80px] text-sm"
                    required
                  />
                  <Button type="submit" disabled={isSavingNote} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm">
                    {isSavingNote ? 'Bezig...' : 'Notitie Opslaan'}
                  </Button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
                <h2 className="text-base font-bold text-slate-900 mb-3">Notities</h2>
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                  {studentNotes.length === 0 && <p className="text-sm text-slate-400">Nog geen notities voor deze student.</p>}
                  {studentNotes.map((note: TeacherNote) => (
                    <div key={note.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[note.category]}`}>
                          {CATEGORY_LABELS[note.category]}
                        </span>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
