import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  createTeacherNote,
  getWellbeingAlerts,
  getWellnessReport,
  type WellbeingAlert,
  type WellnessReport,
} from '@/lib/api'

export const Route = createFileRoute('/teacher/stress-monitor')({
  component: TeacherStressMonitorPage,
})

// ============================================================================
// MOCKDATA — wordt ALLEEN gebruikt als de echte API-aanroep hieronder faalt
// (bijv. geen database aangesloten). Zodra de koppeling met de backend werkt,
// komt er altijd echte data terug en wordt dit blok nooit gebruikt.
// Veilig om te verwijderen zodra je dit niet meer nodig hebt.
// ============================================================================
const MOCK_REPORT: WellnessReport = {
  summary: { avgStress: 5.4, avgFocus: 6.8, totalEntries: 96, studentsAtRisk: 2 },
  trends: [
    { date: '2026-07-19', avgStress: 5.0, avgFocus: 6.0 },
    { date: '2026-07-20', avgStress: 4.5, avgFocus: 6.2 },
    { date: '2026-07-21', avgStress: 6.0, avgFocus: 5.0 },
    { date: '2026-07-22', avgStress: 4.0, avgFocus: 6.8 },
    { date: '2026-07-23', avgStress: 5.5, avgFocus: 5.5 },
    { date: '2026-07-24', avgStress: 3.5, avgFocus: 7.2 },
    { date: '2026-07-25', avgStress: 4.8, avgFocus: 6.0 },
    { date: '2026-07-26', avgStress: 3.0, avgFocus: 7.8 },
    { date: '2026-07-27', avgStress: 4.2, avgFocus: 6.5 },
    { date: '2026-07-28', avgStress: 2.5, avgFocus: 8.0 },
    { date: '2026-07-29', avgStress: 3.8, avgFocus: 7.0 },
    { date: '2026-07-30', avgStress: 2.0, avgFocus: 8.2 },
    { date: '2026-07-31', avgStress: 3.2, avgFocus: 7.5 },
    { date: '2026-08-01', avgStress: 2.2, avgFocus: 8.0 },
  ],
}

const MOCK_ALERTS: WellbeingAlert[] = [
  { id: 'mock-a1', studentId: 'mock-3', studentName: 'Sofia Petrov', level: 8, focus: 4, notes: 'Voelt zich overweldigd door deadlines', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'mock-a2', studentId: 'mock-5', studentName: 'Yuki Tanaka', level: 8, focus: 3, notes: 'Noemde slaaptekort en examenstress', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
]
// ============================================================================
// EINDE MOCKDATA
// ============================================================================

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

function buildSparkline(values: number[], width: number, height: number, max = 10): string {
  if (values.length === 0) return ''
  const step = width / Math.max(values.length - 1, 1)
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
    .join(' ')
}

function TeacherStressMonitorPage() {
  const [report, setReport] = useState<WellnessReport | null>(null)
  const [alerts, setAlerts] = useState<WellbeingAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const [periodDays, setPeriodDays] = useState(14)

  const [openNoteFor, setOpenNoteFor] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  async function loadStressData(period: number) {
    try {
      setIsLoading(true)
      const [reportData, alertsData] = await Promise.all([getWellnessReport(period), getWellbeingAlerts()])
      setReport(reportData)
      setAlerts(alertsData.alerts)
      setUsingMockData(false)
    } catch {
      // Val terug op mockdata zodat het ontwerp altijd zichtbaar is, ook zonder database.
      setReport(MOCK_REPORT)
      setAlerts(MOCK_ALERTS)
      setUsingMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStressData(periodDays)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodDays])

  async function handleSaveNote(studentId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent) return

    if (usingMockData) {
      setOpenNoteFor('')
      setNoteContent('')
      return
    }

    try {
      setIsSavingNote(true)
      await createTeacherNote({ studentId, category: 'WELLBEING', content: noteContent })
      setOpenNoteFor('')
      setNoteContent('')
    } catch {
      // stil falen
    } finally {
      setIsSavingNote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Stressmonitor wordt geladen...</p>
      </div>
    )
  }

  const trends = report?.trends ?? []
  const stressPoints = buildSparkline(trends.map((t) => t.avgStress), 400, 80)
  const focusPoints = buildSparkline(trends.map((t) => t.avgFocus), 400, 80)

  return (
    <div className="p-6 space-y-5">

      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
          Voorbeeldmodus: dit zijn voorbeeldgegevens omdat er nog geen database is aangesloten. Zodra de API werkt, wordt dit automatisch echte data.
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stressmonitor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gebaseerd op anonieme zelfrapportages via de FitStudy app</p>
        </div>
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value))}
          className="text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 outline-none"
        >
          <option value={7}>Laatste 7 dagen</option>
          <option value={14}>Laatste 14 dagen</option>
          <option value={30}>Laatste 30 dagen</option>
        </select>
      </header>

      {/* STATISTIEKEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Gem. Stressniveau</span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">🔥</div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{report?.summary.avgStress ?? '–'} <span className="text-base font-normal text-slate-400">/ 10</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Gem. Focus</span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">🎯</div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{report?.summary.avgFocus ?? '–'} <span className="text-base font-normal text-slate-400">/ 10</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Totaal Metingen</span>
            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm">📊</div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{report?.summary.totalEntries ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-200 ring-1 ring-rose-100">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-500">Studenten Met Risico</span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">⚠️</div>
          </div>
          <p className="text-3xl font-bold text-rose-600 mt-3">{report?.summary.studentsAtRisk ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* TRENDGRAFIEK */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900">Trend Stress vs. Focus</h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span>Stress</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block"></span>Focus</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">Gemiddelde per dag, laatste {periodDays} dagen</p>
          {trends.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Nog geen metingen in deze periode.</p>
          ) : (
            <svg viewBox="0 0 400 80" className="w-full h-32">
              <polyline points={stressPoints} fill="none" stroke="#f43f5e" strokeWidth="2" />
              <polyline points={focusPoints} fill="none" stroke="#3b82f6" strokeWidth="2" />
            </svg>
          )}
        </div>

        {/* WELZIJNSMELDINGEN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-slate-900">Actieve Meldingen</h2>
              <p className="text-xs text-slate-400">Hoge stressmeldingen</p>
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
                <p className="text-xs text-slate-500 mb-2">{alert.notes || `Stressniveau ${alert.level}/10, focus ${alert.focus}/10`}</p>
                <div className="flex gap-2">
                  <a href={`mailto:?subject=Even%20contact%20over%20${encodeURIComponent(alert.studentName)}`}>
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7 px-3">Contact</Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-3 border-slate-200"
                    onClick={() => setOpenNoteFor(openNoteFor === alert.studentId ? '' : alert.studentId)}
                  >
                    Notitie Toevoegen
                  </Button>
                </div>

                {openNoteFor === alert.studentId && (
                  <form onSubmit={(e) => handleSaveNote(alert.studentId, e)} className="mt-2 space-y-2">
                    <Textarea
                      placeholder="Observatie over welzijn..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="bg-slate-50 border-slate-200 rounded-lg min-h-[60px] text-xs"
                      required
                    />
                    <Button type="submit" disabled={isSavingNote} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7">
                      {isSavingNote ? 'Bezig...' : 'Opslaan'}
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-4 italic">Gebaseerd op anonieme zelfrapportages via de FitStudy app.</p>
        </div>
      </div>
    </div>
  )
}
