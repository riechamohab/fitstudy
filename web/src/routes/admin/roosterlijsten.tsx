import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  createWeekSchedule,
  deleteSchedule,
  getSchedules,
  getTeachersBySubject,
  type Schedule,
  type TeacherOption,
  type WeekScheduleEntry,
} from "../../lib/api";

export const Route = createFileRoute("/admin/roosterlijsten")({
  component: AdminRoosterPage,
});

const DAYS: { value: string; label: string }[] = [
  { value: "monday", label: "Maandag" },
  { value: "tuesday", label: "Dinsdag" },
  { value: "wednesday", label: "Woensdag" },
  { value: "thursday", label: "Donderdag" },
  { value: "friday", label: "Vrijdag" },
];

const DAY_LABELS: Record<string, string> = Object.fromEntries(
  DAYS.map((d) => [d.value, d.label])
);

type TimeBlock = {
  id: number;
  label: string;
  start: string;
  end: string;
  locked: boolean;
};

const TIME_BLOCKS: TimeBlock[] = [
  { id: 1, label: "Blok 1", start: "07:00", end: "07:45", locked: false },
  { id: 2, label: "Blok 2", start: "07:46", end: "08:30", locked: false },
  { id: 3, label: "Blok 3", start: "08:31", end: "09:15", locked: false },
  { id: 4, label: "Blok 4", start: "09:16", end: "10:00", locked: false },
  { id: 5, label: "Pauze", start: "10:01", end: "10:15", locked: true },
  { id: 6, label: "Blok 6", start: "10:16", end: "11:00", locked: false },
  { id: 7, label: "Blok 7", start: "11:01", end: "11:45", locked: false },
  { id: 8, label: "Blok 8", start: "11:46", end: "12:30", locked: false },
];

const EDITABLE_BLOCKS = TIME_BLOCKS.filter((b) => !b.locked);

type CellData = { subject: string; teacherId: string };
type GridState = Record<string, Record<number, CellData>>;

function emptyGrid(): GridState {
  const grid: GridState = {};
  for (const day of DAYS) {
    grid[day.value] = {};
    for (const block of EDITABLE_BLOCKS) {
      grid[day.value][block.id] = { subject: "", teacherId: "" };
    }
  }
  return grid;
}

function cellKey(day: string, blockId: number) {
  return `${day}-${blockId}`;
}

function AdminRoosterPage() {
  const formRef = useRef<HTMLFormElement>(null);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [className, setClassName] = useState("");
  const [grid, setGrid] = useState<GridState>(emptyGrid());
  const [teacherOptions, setTeacherOptions] = useState<Record<string, TeacherOption[]>>({});
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [selectedViewClass, setSelectedViewClass] = useState<string>("");

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedules();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon roosters niet ophalen.");
    } finally {
      setLoading(false);
    }
  }

  function updateCellSubject(day: string, blockId: number, subject: string) {
    setGrid((g) => ({
      ...g,
      [day]: {
        ...g[day],
        [blockId]: { subject, teacherId: "" },
      },
    }));
  }

  function updateCellTeacher(day: string, blockId: number, teacherId: string) {
    setGrid((g) => ({
      ...g,
      [day]: {
        ...g[day],
        [blockId]: { ...g[day][blockId], teacherId },
      },
    }));
  }

  async function fetchAndCacheTeachers(subjectName: string) {
    const trimmed = subjectName.trim();
    if (!trimmed || teacherOptions[trimmed] || loadingSubjects[trimmed]) return;

    setLoadingSubjects((s) => ({ ...s, [trimmed]: true }));
    try {
      const teachers = await getTeachersBySubject(trimmed);
      setTeacherOptions((t) => ({ ...t, [trimmed]: teachers }));
    } catch {
      setTeacherOptions((t) => ({ ...t, [trimmed]: [] }));
    } finally {
      setLoadingSubjects((s) => ({ ...s, [trimmed]: false }));
    }
  }

  async function handleSubjectBlur(day: string, blockId: number) {
    const subject = grid[day][blockId].subject;
    await fetchAndCacheTeachers(subject);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!className.trim()) {
      setFormError("Vul een klas in.");
      return;
    }

    const entries: WeekScheduleEntry[] = [];
    for (const day of DAYS) {
      for (const block of EDITABLE_BLOCKS) {
        const cell = grid[day.value][block.id];
        if (!cell.subject.trim()) continue;

        if (!cell.teacherId) {
          setFormError(
            `Kies een docent voor ${DAY_LABELS[day.value]} - ${block.label} (${cell.subject}).`
          );
          return;
        }

        entries.push({
          day: day.value,
          startTime: block.start,
          endTime: block.end,
          subject: cell.subject.trim(),
          teacherId: cell.teacherId,
        });
      }
    }

    if (entries.length === 0) {
      setFormError("Vul minstens één lesblok in.");
      return;
    }

    setSubmitting(true);
    try {
      const existingForClass = schedules.filter(
        (s) => s.className.toLowerCase() === className.trim().toLowerCase()
      );
      for (const item of existingForClass) {
        await deleteSchedule(item.id);
      }

      const result = await createWeekSchedule(className.trim(), entries);
      setFormSuccess(`Weekrooster opgeslagen (${result.count} lessen).`);
      setClassName("");
      setGrid(emptyGrid());
      setTeacherOptions({});
      await loadSchedules();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Kon weekrooster niet opslaan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteClassSchedule(targetClassName: string) {
    if (!confirm(`Weet je zeker dat je het rooster voor klas ${targetClassName} wilt verwijderen?`)) return;
    try {
      const itemsToDelete = schedules.filter((s) => s.className === targetClassName);
      for (const item of itemsToDelete) {
        await deleteSchedule(item.id);
      }
      setSchedules((prev) => prev.filter((s) => s.className !== targetClassName));
      setSelectedViewClass("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon rooster niet verwijderen.");
    }
  }

  async function handleManageClassSchedule(targetClassName: string) {
    const classEntries = schedules.filter((s) => s.className === targetClassName);
    const newGrid = emptyGrid();
    const newTeacherOptions: Record<string, TeacherOption[]> = { ...teacherOptions };

    const uniqueSubjects = Array.from(
      new Set(classEntries.map((e) => e.subject).filter(Boolean))
    );

    for (const subj of uniqueSubjects) {
      if (!newTeacherOptions[subj]) {
        try {
          const teachers = await getTeachersBySubject(subj);
          newTeacherOptions[subj] = teachers;
        } catch {
          newTeacherOptions[subj] = [];
        }
      }
    }

    for (const entry of classEntries) {
      const dayVal = entry.day.toLowerCase();
      const entryTime = entry.startTime.trim().substring(0, 5);
      const block = EDITABLE_BLOCKS.find((b) => b.start.trim().substring(0, 5) === entryTime);

      if (dayVal && block) {
        newGrid[dayVal][block.id] = {
          subject: entry.subject,
          teacherId: entry.teacherId ?? "",
        };
      }
    }

    setClassName(targetClassName);
    setGrid(newGrid);
    setTeacherOptions(newTeacherOptions);
    setFormError(null);
    setFormSuccess(null);

    // Scroll automatisch soepel naar het formulier bovenaan
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const availableClasses = Array.from(new Set(schedules.map((s) => s.className))).filter(Boolean);
  const selectedClassSchedules = schedules.filter((s) => s.className === selectedViewClass);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Roosterbeheer</h1>
      <p className="mt-1 text-sm text-slate-500">
        Vul het weekrooster van een klas in of beheer een bestaand rooster.
      </p>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-slate-700">Klas</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Bijv. B4"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-32 border-b border-slate-200 p-2 text-left font-medium text-slate-500">
                  Tijdsblok
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.value}
                    className="border-b border-slate-200 p-2 text-left font-medium text-slate-500"
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_BLOCKS.map((block) =>
                block.locked ? (
                  <tr key={block.id} className="bg-slate-50">
                    <td colSpan={DAYS.length + 1} className="p-2 text-center text-xs font-medium text-slate-400">
                      {block.label} ({block.start} - {block.end}) — vast, niet bewerkbaar
                    </td>
                  </tr>
                ) : (
                  <tr key={block.id} className="align-top">
                    <td className="border-b border-slate-100 p-2 text-xs text-slate-500">
                      {block.label}
                      <br />
                      {block.start} - {block.end}
                    </td>
                    {DAYS.map((day) => {
                      const cell = grid[day.value][block.id];
                      const subject = cell.subject.trim();
                      const options = subject ? teacherOptions[subject] : undefined;
                      const isLoadingOptions = subject ? loadingSubjects[subject] : false;

                      return (
                        <td key={cellKey(day.value, block.id)} className="border-b border-slate-100 p-2">
                          <input
                            type="text"
                            value={cell.subject}
                            onChange={(e) =>
                              updateCellSubject(day.value, block.id, e.target.value)
                            }
                            onBlur={() => handleSubjectBlur(day.value, block.id)}
                            placeholder="Vak"
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                          />
                          {subject && (
                            <select
                              value={cell.teacherId}
                              onChange={(e) =>
                                updateCellTeacher(day.value, block.id, e.target.value)
                              }
                              disabled={isLoadingOptions}
                              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-50"
                            >
                              <option value="">
                                {isLoadingOptions ? "Laden..." : "Kies docent"}
                              </option>
                              {(options ?? []).map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {subject && !isLoadingOptions && options?.length === 0 && (
                            <p className="mt-1 text-[11px] text-amber-600">
                              Geen docenten voor dit vak.
                            </p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}
        {formSuccess && <p className="mt-4 text-sm text-emerald-600">{formSuccess}</p>}

        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Bezig met opslaan..." : "Weekrooster opslaan"}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Bestaande roosters</h2>

      {loading && <p className="mt-4 text-sm text-slate-500">Roosters laden...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && availableClasses.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">Nog geen roosters</p>
          <p className="mt-2 text-sm text-slate-500">
            Vul hierboven een weekrooster in om te beginnen.
          </p>
        </div>
      )}

      {!loading && !error && availableClasses.length > 0 && (
        <div className="mt-4">
          <div className="max-w-xs mb-4">
            <label className="block text-sm font-medium text-slate-700">Selecteer klas om rooster te bekijken</label>
            <select
              value={selectedViewClass}
              onChange={(e) => setSelectedViewClass(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">-- Kies een klas --</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Klas {cls}
                </option>
              ))}
            </select>
          </div>

          {selectedViewClass && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Rooster voor klas {selectedViewClass}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleManageClassSchedule(selectedViewClass)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Beheren
                  </button>
                  <button
                    onClick={() => handleDeleteClassSchedule(selectedViewClass)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="w-32 border-b border-slate-200 p-2 text-left font-medium text-slate-500">
                        Tijdsblok
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day.value}
                          className="border-b border-slate-200 p-2 text-left font-medium text-slate-500"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_BLOCKS.map((block) => {
                      if (block.locked) {
                        return (
                          <tr key={block.id} className="bg-slate-50">
                            <td colSpan={DAYS.length + 1} className="p-2 text-center text-xs font-medium text-slate-400">
                              {block.label} ({block.start} - {block.end}) — vast
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={block.id} className="align-top">
                          <td className="border-b border-slate-100 p-2 text-xs text-slate-500">
                            {block.label}
                            <br />
                            {block.start} - {block.end}
                          </td>
                          {DAYS.map((day) => {
                            const entry = selectedClassSchedules.find((s) => {
                              if (s.day.toLowerCase() !== day.value.toLowerCase()) return false;
                              
                              const entryTime = s.startTime.trim().substring(0, 5);
                              const blockTime = block.start.trim().substring(0, 5);
                              
                              return entryTime === blockTime || entryTime.startsWith(blockTime);
                            });

                            return (
                              <td key={`view-${day.value}-${block.id}`} className="border-b border-slate-100 p-2 text-xs">
                                {entry ? (
                                  <div className="rounded-md bg-slate-50 p-2 border border-slate-200">
                                    <p className="font-semibold text-slate-900">{entry.subject}</p>
                                    <p className="text-slate-500 mt-0.5">{entry.teacherName || entry.location || "Ingepland"}</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
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
            </div>
          )}
        </div>
      )}
    </main>
  );
}