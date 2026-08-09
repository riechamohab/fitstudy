import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CoursesIcon } from "../../components/ui/icons";

export const Route = createFileRoute("/docent/programma")({
  component: TeacherProgramPage,
});

interface ProgramItem {
  id: string;
  subject: string;
  period: string;
  chapter: string;
  lesson: string;
  topics?: string;
}

function TeacherProgramPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("Kwartaal 1");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [topics, setTopics] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      // Haal zowel het programma als de vakken van de docent op
      const [progRes, subjRes] = await Promise.all([
        fetch("/api/teacher/programs", { credentials: "include" }),
        fetch("/api/teacher/subjects", { credentials: "include" }),
      ]);

      if (!progRes.ok || !subjRes.ok) throw new Error("Kon gegevens niet ophalen.");

      const progData = await progRes.json();
      const subjData = await subjRes.json();

      setPrograms(progData);
      setTeacherSubjects(subjData.subjects || []);

      // Als er vakken zijn, selecteer standaard de eerste
      if (subjData.subjects && subjData.subjects.length > 0) {
        setSubject(subjData.subjects[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/teacher/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, period, chapter, lesson, topics }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Opslaan mislukt.");

      setChapter("");
      setLesson("");
      setTopics("");
      
      // Programma lijst verversen
      const progRes = await fetch("/api/teacher/programs", { credentials: "include" });
      setPrograms(await progRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-green-600">
          <CoursesIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vakprogramma Beheren</h1>
          <p className="text-gray-500 text-sm">
            Deel je hoofdstukken, lessen en onderdelen in per periode voor jouw vakken.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Formulier */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Nieuw onderdeel toevoegen</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
            {teacherSubjects.length > 1 ? (
              // Dropdown als de docent 2 of meer vakken heeft
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white"
                required
              >
                {teacherSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              // Vaste tekst of read-only veld als de docent maar 1 vak heeft
              <input
                type="text"
                disabled
                value={subject || teacherSubjects[0] || "Geen vak gekoppeld"}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 text-sm cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode / Kwartaal</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white"
            >
              <option value="Kwartaal 1">Kwartaal 1</option>
              <option value="Kwartaal 2">Kwartaal 2</option>
              <option value="Kwartaal 3">Kwartaal 3</option>
              <option value="Kwartaal 4">Kwartaal 4</option>
              <option value="Hele Jaar">Hele Jaar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hoofdstuk</label>
            <input
              type="text"
              required
              placeholder="Bijv. Hoofdstuk 3"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Les</label>
            <input
              type="text"
              required
              placeholder="Bijv. Les 1: Snelheid"
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Onderdelen / Details (optioneel)</label>
            <input
              type="text"
              placeholder="Bijv. Formule berekenen, opgave 1 t/m 5"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || teacherSubjects.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {submitting ? "Bezig met opslaan..." : "Toevoegen aan programma"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel met overzicht */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Huidig Behandelplan</h2>
      {loading ? (
        <p className="text-gray-500 animate-pulse">Programma laden...</p>
      ) : programs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          <p>Je hebt nog geen onderdelen toegevoegd.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4">Periode</th>
                <th className="p-4">Vak</th>
                <th className="p-4">Hoofdstuk / Les</th>
                <th className="p-4">Onderdelen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {programs.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-semibold text-green-700">{item.period}</td>
                  <td className="p-4 font-medium text-gray-900">{item.subject}</td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{item.chapter}</div>
                    <div className="text-gray-500 text-xs">{item.lesson}</div>
                  </td>
                  <td className="p-4 text-gray-600">{item.topics || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}