import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CoursesIcon } from "../../components/ui/icons";
import {
  createTeacherProgram,
  getTeacherClasses,
  getTeacherPrograms,
  getTeacherSchedule,
  type TeacherProgram,
} from "../../lib/api";

export const Route = createFileRoute("/docent/programma")({
  component: TeacherProgramPage,
});

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type ChapterGroup = {
  key: string;
  subject: string;
  period: string;
  chapter: string;
  items: TeacherProgram[];
};

function TeacherProgramPage() {
  const [programs, setPrograms] = useState<TeacherProgram[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [period, setPeriod] = useState("Kwartaal 1");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [topics, setTopics] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError(null);

      const [progData, classesData, scheduleData] = await Promise.all([
        getTeacherPrograms(),
        getTeacherClasses(),
        getTeacherSchedule(),
      ]);

      const subjectsFromSchedule = Array.from(
        new Set(scheduleData.map((s) => s.subject).filter(Boolean))
      ).sort();

      setPrograms(progData);
      setTeacherClasses(classesData.classes);
      setTeacherSubjects(subjectsFromSchedule);

      if (subjectsFromSchedule.length > 0) {
        setSubject(subjectsFromSchedule[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon gegevens niet ophalen.");
    } finally {
      setLoading(false);
    }
  }

  function toggleClass(klas: string) {
    setSelectedClasses((prev) =>
      prev.includes(klas) ? prev.filter((c) => c !== klas) : [...prev, klas]
    );
  }

  function toggleChapter(key: string) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!subject) {
      setError("Vak is verplicht.");
      setSubmitting(false);
      return;
    }

    if (selectedClasses.length === 0) {
      setError("Kies minstens 1 klas.");
      setSubmitting(false);
      return;
    }

    try {
      await Promise.all(
        selectedClasses.map((klas) =>
          createTeacherProgram({
            subject,
            className: klas,
            period,
            chapter,
            lesson,
            topics,
          })
        )
      );

      setChapter("");
      setLesson("");
      setTopics("");
      setSelectedClasses([]);

      const progData = await getTeacherPrograms();
      setPrograms(progData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  const programsByClass = programs.reduce<Record<string, TeacherProgram[]>>((acc, item) => {
    const key = item.className || "Onbekende klas";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const classGroups = Object.keys(programsByClass).sort();

  function groupByChapter(items: TeacherProgram[]): ChapterGroup[] {
    const map = new Map<string, ChapterGroup>();

    for (const item of items) {
      const key = `${item.subject}__${item.period}__${item.chapter}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          subject: item.subject,
          period: item.period,
          chapter: item.chapter,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }

    return Array.from(map.values()).sort((a, b) => a.chapter.localeCompare(b.chapter));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-blue-600">
          <CoursesIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vakprogramma Beheren</h1>
          <p className="text-gray-500 text-sm">
            Deel je hoofdstukken, lessen en onderdelen in per periode, per klas.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Nieuw onderdeel toevoegen</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Klas(sen) <span className="font-normal text-gray-400">(kies minstens 1)</span>
            </label>
            {teacherClasses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teacherClasses.map((klas) => {
                  const isSelected = selectedClasses.includes(klas);
                  return (
                    <label
                      key={klas}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClass(klas)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {klas}
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                disabled
                value="Geen klas gekoppeld"
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 text-sm cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
            {teacherSubjects.length > 1 ? (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                required
              >
                {teacherSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Onderdelen / Details (optioneel)</label>
            <input
              type="text"
              placeholder="Bijv. Formule berekenen, opgave 1 t/m 5"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || teacherSubjects.length === 0 || teacherClasses.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {submitting ? "Bezig met opslaan..." : "Toevoegen aan programma"}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Huidig Behandelplan</h2>
      {loading ? (
        <p className="text-gray-500 animate-pulse">Programma laden...</p>
      ) : classGroups.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          <p>Je hebt nog geen onderdelen toegevoegd.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {classGroups.map((klas) => {
            const chapterGroups = groupByChapter(programsByClass[klas]);

            return (
              <div key={klas}>
                <h3 className="text-md font-bold text-blue-700 mb-2">Klas {klas}</h3>
                <div className="space-y-2">
                  {chapterGroups.map((group) => {
                    const chapterKey = `${klas}__${group.key}`;
                    const isOpen = expandedChapters.has(chapterKey);

                    return (
                      <div
                        key={chapterKey}
                        className="bg-white shadow-sm border rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapterKey)}
                          className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/50 transition"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{group.chapter}</p>
                            <p className="text-xs text-gray-500">
                              {group.subject} · {group.period} · {group.items.length}{" "}
                              {group.items.length === 1 ? "les" : "lessen"}
                            </p>
                          </div>
                          <ChevronDownIcon open={isOpen} />
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
                                <tr>
                                  <th className="p-3">Les</th>
                                  <th className="p-3">Onderdelen</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {group.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="p-3 font-medium text-gray-800">{item.lesson}</td>
                                    <td className="p-3 text-gray-600">{item.topics || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
