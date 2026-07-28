import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/teacher')({
  component: TeacherDashboard,
})

function TeacherDashboard() {
  // State voor Notities & Notificaties
  const [selectedStudent, setSelectedStudent] = useState('')
  const [noteCategory, setNoteCategory] = useState('Welzijn')
  const [noteContent, setNoteContent] = useState('')
  const [sendAsNotification, setSendAsNotification] = useState(false)

  // State voor de "Nieuwe Opdracht" Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [taskDescription, setTaskDescription] = useState('')

  // State voor het Lesrooster
  const [schedule, setSchedule] = useState([
    { id: '1', day: 'Maandag', time: '08:30 - 10:00', subject: 'Software Engineering', room: 'Lokaal A1' },
    { id: '2', day: 'Dinsdag', time: '10:15 - 11:45', subject: 'Database Systems', room: 'Lokaal B3' },
    { id: '3', day: 'Donderdag', time: '13:00 - 14:30', subject: 'Web Development', room: 'Computerlab 2' },
  ])

  // State voor de "Nieuwe Les" Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [lessonSubject, setLessonSubject] = useState('')
  const [lessonDay, setLessonDay] = useState('Maandag')
  const [lessonTime, setLessonTime] = useState('')
  const [lessonRoom, setLessonRoom] = useState('')

  // Voorbeeld data van studenten
  const students = [
    { id: '1', name: 'Anish Sharma', status: 'Op schema', progress: 85, stress: 'Laag', stressColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: '2', name: 'Maya Patel', status: 'Achter op schema', progress: 40, stress: 'Hoog', stressColor: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: '3', name: 'Kevin de Vries', status: 'Op schema', progress: 70, stress: 'Gemiddeld', stressColor: 'bg-amber-100 text-amber-700 border-amber-200' },
  ]

  // Notitie / Notificatie opslaan handler
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !noteContent) return

    const studentObj = students.find((s) => s.id === selectedStudent)
    const studentName = studentObj ? studentObj.name : 'de student'

    if (sendAsNotification) {
      alert(`🔔 Notificatie direct verzonden naar ${studentName}!\n\nBericht: "${noteContent}"`)
    } else {
      alert(`📝 Notitie voor ${studentName} opgeslagen in het dossier.`)
    }

    setNoteContent('')
    setSendAsNotification(false)
  }

  // Opdracht aanmaken handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle) return

    alert(`Nieuwe opdracht "${taskTitle}" is succesvol aangemaakt!`)
    setTaskTitle('')
    setTaskDeadline('')
    setTaskDescription('')
    setIsTaskModalOpen(false)
  }

  // Les toevoegen handler
  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonSubject || !lessonTime) return

    const newLesson = {
      id: Date.now().toString(),
      subject: lessonSubject,
      day: lessonDay,
      time: lessonTime,
      room: lessonRoom || 'Nog niet toegewezen',
    }

    setSchedule([...schedule, newLesson])
    alert(`Les "${lessonSubject}" is toegevoegd aan het rooster!`)

    setLessonSubject('')
    setLessonTime('')
    setLessonRoom('')
    setIsScheduleModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6 font-sans relative">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Docentendashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welkom terug! Bekijk en beheer de prestaties en het welzijn van je studenten.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input placeholder="Zoek op student..." className="w-full md:w-64 bg-slate-50 border-slate-200" />
          <Button 
            onClick={() => setIsTaskModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            + Nieuwe Opdracht
          </Button>
        </div>
      </header>

      {/* STATISTIEKEN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actieve Studenten</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-extrabold text-slate-800">24</p>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+2 deze maand</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gemiddeld Stressniveau</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-extrabold text-emerald-600">2.1 <span className="text-sm font-normal text-slate-400">/ 5</span></p>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Laag</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingeleverde Opdrachten</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-extrabold text-slate-800">78%</p>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Op koers</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aandacht Vereist</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-extrabold text-rose-600">2</p>
            <span className="text-xs font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">Meldingen</span>
          </div>
        </div>
      </div>

      {/* INHOUD GRID (TABEL + NOTITIES) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STUDENTEN TABEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-slate-800">Studenten Voortgang & Welzijn</h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">Totaal: {students.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3 pl-4">Student</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Voortgang</th>
                  <th className="p-3">Stress-indicator</th>
                  <th className="p-3 text-right pr-4">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-slate-800">{student.name}</td>
                    <td className="p-3 font-medium text-slate-600">{student.status}</td>
                    <td className="p-3">
                      <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px] overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">{student.progress}%</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${student.stressColor}`}>
                        {student.stress}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                        onClick={() => setSelectedStudent(student.id)}
                      >
                        + Notitie
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NOTITIES & NOTIFICATIES FORMULIER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Observaties & Notificaties</h2>
            <p className="text-xs text-slate-500">Voeg een persoonlijke notitie toe of stuur een directe melding naar een student.</p>
          </div>

          <form onSubmit={handleSaveNote} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Selecteer Student</label>
              <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">Kies een student uit de lijst...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Categorie</label>
              <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                value={noteCategory} 
                onChange={(e) => setNoteCategory(e.target.value)}
              >
                <option value="Welzijn">Welzijn & Stress</option>
                <option value="Studievoortgang">Studievoortgang</option>
                <option value="Opvolging">Opvolging Nodig</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Observatie / Bericht</label>
              <Textarea 
                placeholder="Typ hier de observatie of het bericht..." 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="bg-slate-50 border-slate-200 rounded-xl min-h-[100px]"
                required
              />
            </div>

            {/* DIRECTE NOTIFICATIE CHECKBOX */}
            <div className="flex items-center gap-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <input 
                type="checkbox" 
                id="notifyCheckbox"
                checked={sendAsNotification}
                onChange={(e) => setSendAsNotification(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="notifyCheckbox" className="text-xs font-medium text-indigo-900 cursor-pointer">
                🔔 Verstuur als directe notificatie naar student
              </label>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-medium shadow-sm">
              {sendAsNotification ? 'Notificatie Verzenden' : 'Notitie Opslaan'}
            </Button>
          </form>
        </div>

      </div>

      {/* LESROOSTER SECTIE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Lesrooster</h2>
            <p className="text-xs text-slate-500">Overzicht en beheer van ingeplande lessen en vakken.</p>
          </div>
          <Button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-sm self-start sm:self-auto"
          >
            + Les Toevoegen
          </Button>
        </div>

        {/* LESTABELLEN / LIJST */}
        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-4 pt-2">
          {schedule.map((item) => (
            <div key={item.id} className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2 relative group hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                  {item.day}
                </span>
                <span className="text-xs text-slate-400 font-medium">{item.room}</span>
              </div>
              <h4 className="font-semibold text-slate-800 text-base">{item.subject}</h4>
              <p className="text-xs text-slate-500 font-medium">⏰ {item.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL VOOR NIEUWE OPDRACHT */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Nieuwe Opdracht Aanmaken</h3>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                  Titel van Opdracht
                </label>
                <Input 
                  placeholder="bijv. Huiswerk Hoofdstuk 3"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                  Deadline
                </label>
                <Input 
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                  Beschrijving / Instructies
                </label>
                <Textarea 
                  placeholder="Korte toelichting voor de studenten..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="bg-slate-50 border-slate-200 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="border-slate-200 text-slate-600"
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Opdracht Aanmaken
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VOOR NIEUWE LES IN ROOSTER */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Nieuwe Les Toevoegen</h3>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                  Vaknaam
                </label>
                <Input 
                  placeholder="bijv. Software Engineering"
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                    Dag
                  </label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    value={lessonDay} 
                    onChange={(e) => setLessonDay(e.target.value)}
                  >
                    <option value="Maandag">Maandag</option>
                    <option value="Dinsdag">Dinsdag</option>
                    <option value="Woensdag">Woensdag</option>
                    <option value="Donderdag">Donderdag</option>
                    <option value="Vrijdag">Vrijdag</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                    Lokaal / Ruimte
                  </label>
                  <Input 
                    placeholder="bijv. A1 of Lab 2"
                    value={lessonRoom}
                    onChange={(e) => setLessonRoom(e.target.value)}
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block uppercase tracking-wider">
                  Tijdstip
                </label>
                <Input 
                  placeholder="bijv. 08:30 - 10:00"
                  value={lessonTime}
                  onChange={(e) => setLessonTime(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="border-slate-200 text-slate-600"
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Les Opslaan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}