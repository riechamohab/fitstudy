import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProgressIcon } from "../../components/ui/icons";
import { API_BASE_URL } from "../../lib/api";

export const Route = createFileRoute("/docent/beoordelingen")({
  component: TeacherGradesPage,
});

interface GradeItem {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  assessmentName: string;
  gradedAt: string;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  className?: string | null;
}

function TeacherGradesPage() {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invoer state
  const [subject, setSubject] = useState("");
  const [assessmentName, setAssessmentName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [studentScores, setStudentScores] = useState<Record<string, string>>({});
  
  // Filter state voor het overzicht onderaan
  const [filterClass, setFilterClass] = useState("ALL");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [gradesRes, studentsRes, subjectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/teacher/grades-page`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/teacher/students`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/teacher/subjects`, { credentials: "include" }),
      ]);

      if (!gradesRes.ok || !studentsRes.ok || !subjectsRes.ok) {
        throw new Error("Kon gegevens niet ophalen.");
      }

      const gradesData = await gradesRes.json();
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();

      setGrades(gradesData);
      setStudents(studentsData);
      setTeacherSubjects(subjectsData.subjects || []);

      if (subjectsData.subjects && subjectsData.subjects.length > 0) {
        setSubject(subjectsData.subjects[0]);
      }

      const uniqueClasses = Array.from(new Set(studentsData.map((s: StudentItem) => s.className).filter(Boolean))) as string[];
      if (uniqueClasses.length > 0) {
        setSelectedClass(uniqueClasses[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter((s) => !selectedClass || s.className === selectedClass);
  const availableClasses = Array.from(new Set(students.map((s) => s.className).filter(Boolean))) as string[];

  function handleScoreChange(studentId: string, value: string) {
    setStudentScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  }

  async function handleSaveAllGrades(e: React.FormEvent) {
    e.preventDefault();
    if (!assessmentName.trim()) {
      setError("Voer eerst een toetsnaam in.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const promises = Object.entries(studentScores).map(async ([studentId, scoreVal]) => {
        if (!scoreVal || scoreVal.trim() === "") return;
        const scoreNumber = parseFloat(scoreVal);
        if (isNaN(scoreNumber)) return;

        const res = await fetch(`${API_BASE_URL}/api/teacher/grades`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            subject,
            assessmentName,
            score: scoreNumber,
          }),
          credentials: "include",
        });

        if (!res.ok) throw new Error("Kon niet alle cijfers opslaan.");
      });

      await Promise.all(promises);

      setSuccessMessage("Alle cijfers succesvol opgeslagen voor deze toets!");
      setStudentScores({});
      setAssessmentName("");

      const gradesRes = await fetch(`${API_BASE_URL}/api/teacher/grades-page`, { credentials: "include" });
      if (gradesRes.ok) setGrades(await gradesRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Bepaal de gefilterde studenten voor het overzicht
  const overviewStudents = students.filter((s) => filterClass === "ALL" || s.className === filterClass);
  const overviewStudentIds = new Set(overviewStudents.map((s) => s.id));

  // Filter cijfers op basis van de geselecteerde klas in het overzicht
  const gradesForOverview = grades.filter((g) => overviewStudentIds.has(g.studentId));

  // Haal unieke toetsnamen op voor de kolommen in de matrix
  const assessmentNames = Array.from(new Set(gradesForOverview.map((g) => g.assessmentName)));

  // Voor statistieken en meest recente cijfers per student per toets:
  // Als er meerdere cijfers voor dezelfde toets zijn, nemen we de meest recente op basis van 'gradedAt'
  const latestGradesMap = new Map<string, GradeItem>();
  // Sorteer op datum oplopend zodat de nieuwste de oudste overschrijft in de map
  const sortedGradesForStats = [...gradesForOverview].sort((a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime());
  
  sortedGradesForStats.forEach((g) => {
    const key = `${g.studentId}-${g.assessmentName}`;
    latestGradesMap.set(key, g);
  });

  const latestGradesList = Array.from(latestGradesMap.values());
  const totalCount = latestGradesList.length;
  const sufficientCount = latestGradesList.filter((g) => g.score >= 5.5).length;
  const insufficientCount = latestGradesList.filter((g) => g.score < 5.5).length;
  const sufficientPercentage = totalCount > 0 ? Math.round((sufficientCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-blue-600">
          <ProgressIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Beoordelingen & Cijfers</h1>
          <p className="text-gray-500 text-sm">
            Geef cijfers op per toets en bekijk het matrix-overzicht per klas met de meest recente resultaten.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Klas filter voor statistieken en overzicht */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Filter overzicht en statistieken op klas:</span>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white font-medium"
        >
          <option value="ALL">Alle klassen</option>
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>Klas {cls}</option>
          ))}
        </select>
      </div>

      {/* Statistieken widgets (gebaseerd op meest recente cijfers van de gefilterde klas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Voldoendes (≥ 5.5)</p>
            <h3 className="text-2xl font-bold text-green-600">{sufficientCount}</h3>
          </div>
          <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
            {sufficientPercentage}% recent
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Onvoldoendes (&lt; 5.5)</p>
            <h3 className="text-2xl font-bold text-red-600">{insufficientCount}</h3>
          </div>
          <div className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
            {100 - sufficientPercentage}% recent
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Beoordeeld (Meest Recent)</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalCount}</h3>
          </div>
          <div className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            Unieke resultaten
          </div>
        </div>
      </div>

      {/* Formulier: Cijfers invoeren */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cijfers invoeren per toets en klas</h2>
        <form onSubmit={handleSaveAllGrades}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white"
                required
              >
                {teacherSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toets / Opdracht naam</label>
              <input
                type="text"
                required
                placeholder="Bijv. Proefwerk Hoofdstuk 2"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klas selecteren</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white"
                required
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Studenten van klas {selectedClass}</h3>
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">Geen studenten gevonden in deze klas.</p>
            ) : (
              <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase sticky top-0">
                    <tr>
                      <th className="p-3">Studentnaam</th>
                      <th className="p-3">E-mailadres</th>
                      <th className="p-3 w-40">Cijfer (1.0 - 10.0)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-3 font-medium text-gray-900">{student.name}</td>
                        <td className="p-3 text-gray-500">{student.email}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="10.0"
                            placeholder="Bijv. 7.5"
                            value={studentScores[student.id] || ""}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || filteredStudents.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
            >
              {submitting ? "Bezig met opslaan..." : "Alle ingevulde cijfers opslaan"}
            </button>
          </div>
        </form>
      </div>

      {/* Matrix Overzichtstabel per klas met toetsen als kolommen */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Overzicht Ingevoerde Cijfers per Klas
        </h2>

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white font-medium"
        >
          <option value="ALL">Alle klassen</option>
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>
              Klas {cls}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500 animate-pulse">Cijfers laden...</p>
      ) : overviewStudents.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          <p>Geen studenten gevonden voor de geselecteerde filter.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-4">Klas</th>
                <th className="p-4">Studentnaam</th>
                {assessmentNames.map((testName) => (
                  <th key={testName} className="p-4 text-center whitespace-nowrap">
                    {testName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {overviewStudents.map((student) => {
                return (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-semibold text-green-700">{student.className ?? "-"}</td>
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                    {assessmentNames.map((testName) => {
                      // Zoek het meest recente cijfer voor deze student en deze toets
                      const matchingGrades = gradesForOverview.filter(
                        (g) => g.studentId === student.id && g.assessmentName === testName
                      );
                      // Sorteer op datum om de laatste te pakken
                      matchingGrades.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());
                      const latestGrade = matchingGrades[0];

                      return (
                        <td key={testName} className="p-4 text-center">
                          {latestGrade ? (
                            <span
                              className={`px-2.5 py-1 rounded-md font-bold text-xs inline-block ${
                                latestGrade.score >= 5.5
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {latestGrade.score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}