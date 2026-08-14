import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getClassSchedule,
  getStudentStudyProgram,
  type ClassScheduleResponse,
  type TeacherProgram,
} from "../../lib/api";

export const Route = createFileRoute("/student/studieprogramma")({
  component: CoursesPage,
});

const DAYS: { value: string; label: string }[] = [
  { value: "monday", label: "Maandag" },
  { value: "tuesday", label: "Dinsdag" },
  { value: "wednesday", label: "Woensdag" },
  { value: "thursday", label: "Donderdag" },
  { value: "friday", label: "Vrijdag" },
];

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
  { id: 9, label: "Blok 9", start: "11:46", end: "12:30", locked: false },
];

type ChapterGroup = {
  key: string;
  subject: string;
  period: string;
  chapter: string;
  items: TeacherProgram[];
};

function getSchoolYearLabel(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 8 ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ScheduleGrid({ schedule }: { schedule: ClassScheduleResponse }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-28 border-b border-slate-200 p-2 text-left font-medium text-slate-500">
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
                  <td
                    colSpan={DAYS.length + 1}
                    className="p-2 text-center text-xs font-medium text-slate-400"
                  >
                    {block.label} ({block.start} - {block.end})
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
                  const entry = schedule.entries.find((e) => {
                    if (e.day.toLowerCase() !== day.value) {
                      return false;
                    }

                    const entryStart = e.startTime.trim().substring(0, 5);

                    return entryStart === block.start;
                  });

                  return (
                    <td
                      key={`${day.value}-${block.id}`}
                      className="border-b border-slate-100 p-2"
                    >
                      {entry ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="font-semibold text-slate-900">
                            {entry.subject}
                          </p>

                          {entry.teacherName && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {entry.teacherName}
                            </p>
                          )}

                          {entry.location && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {entry.location}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
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
  );
}

function CoursesPage() {
  const [programs, setPrograms] = useState<TeacherProgram[]>([]);
  const [programClassName, setProgramClassName] = useState<string | null>(null);

  const [schedule, setSchedule] =
    useState<ClassScheduleResponse | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [expandedSubject, setExpandedSubject] =
    useState<string | null>(null);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );

  async function loadData() {
    setIsLoading(true);
    setError("");

    try {
      const [programData, scheduleData] = await Promise.all([
        getStudentStudyProgram(),
        getClassSchedule(),
      ]);

      setPrograms(programData.programs);
      setProgramClassName(programData.className);
      setSchedule(scheduleData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kon gegevens niet laden"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleSubject(subject: string) {
    setExpandedSubject((previous) =>
      previous === subject ? null : subject
    );
  }

  function toggleChapter(key: string) {
    setExpandedChapters((previous) => {
      const next = new Set(previous);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function groupByChapter(items: TeacherProgram[]): ChapterGroup[] {
    const groups = new Map<string, ChapterGroup>();

    for (const item of items) {
      const key = `${item.subject}__${item.period}__${item.chapter}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          subject: item.subject,
          period: item.period,
          chapter: item.chapter,
          items: [],
        });
      }

      groups.get(key)!.items.push(item);
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.chapter.localeCompare(b.chapter, "nl", {
        numeric: true,
      })
    );
  }

  const programsBySubject = programs.reduce<Record<string, TeacherProgram[]>>(
    (result, item) => {
      if (!result[item.subject]) {
        result[item.subject] = [];
      }

      result[item.subject].push(item);

      return result;
    },
    {}
  );

  const subjects = Object.keys(programsBySubject).sort();

  const schoolYear = getSchoolYearLabel(new Date());

  const hasScheduleEntries = (schedule?.entries.length ?? 0) > 0;

  const displayedClassName =
    schedule?.className ?? programClassName;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl">

        {/* LESROOSTER */}

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900">
            Lesrooster
            {displayedClassName
              ? ` klas ${displayedClassName}`
              : ""}{" "}
            (schooljaar {schoolYear})
          </h1>

          {isLoading ? (
            <p className="mt-3 text-sm text-slate-500">
              Lesrooster laden...
            </p>
          ) : !displayedClassName ? (
            <p className="mt-3 text-sm text-slate-400">
              Er is nog geen klas aan je account gekoppeld.
            </p>
          ) : !hasScheduleEntries ? (
            <p className="mt-3 text-sm text-slate-400">
              De administratie heeft nog geen lesrooster geplaatst voor
              jouw klas.
            </p>
          ) : schedule ? (
            <ScheduleGrid schedule={schedule} />
          ) : null}
        </div>

        {/* STUDIEPROGRAMMA */}

        <div>
          <h2 className="mb-1 text-2xl font-bold text-slate-900">
            Studieprogramma
          </h2>

          <p className="mb-5 text-sm text-slate-500">
            Klik op een vak om de hoofdstukken, lessen en onderdelen te
            bekijken.
          </p>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-slate-500">
              Studieprogramma laden...
            </p>
          ) : !programClassName ? (
            <p className="text-sm text-slate-400">
              Er is nog geen klas aan je account gekoppeld.
            </p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-slate-400">
              Je docent heeft nog geen studieprogramma geplaatst.
            </p>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject) => {
                const isSubjectOpen =
                  expandedSubject === subject;

                const subjectPrograms =
                  programsBySubject[subject];

                const chapterGroups =
                  groupByChapter(subjectPrograms);

                return (
                  <div
                    key={subject}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    {/* VAK */}

                    <button
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className="flex w-full items-center justify-between gap-3 p-5 text-left transition hover:bg-slate-50"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {subject}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {chapterGroups.length}{" "}
                          {chapterGroups.length === 1
                            ? "hoofdstuk"
                            : "hoofdstukken"}
                        </p>
                      </div>

                      <ChevronDownIcon open={isSubjectOpen} />
                    </button>

                    {/* HOOFDSTUKKEN */}

                    {isSubjectOpen && (
                      <div className="border-t border-slate-100 p-5">
                        <div className="space-y-3">
                          {chapterGroups.map((group) => {
                            const chapterKey = group.key;

                            const isChapterOpen =
                              expandedChapters.has(chapterKey);

                            return (
                              <div
                                key={chapterKey}
                                className="overflow-hidden rounded-lg border border-slate-200"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleChapter(chapterKey)
                                  }
                                  className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                                >
                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {group.chapter}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                      {group.period} ·{" "}
                                      {group.items.length}{" "}
                                      {group.items.length === 1
                                        ? "les"
                                        : "lessen"}
                                    </p>
                                  </div>

                                  <ChevronDownIcon
                                    open={isChapterOpen}
                                  />
                                </button>

                                {/* LESSEN */}

                                {isChapterOpen && (
                                  <div className="divide-y divide-slate-100">
                                    {group.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="p-4"
                                      >
                                        <p className="font-medium text-slate-800">
                                          {item.lesson}
                                        </p>

                                        {item.topics ? (
                                          <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-500">
                                              Onderdelen
                                            </p>

                                            <p className="text-sm text-slate-700">
                                              {item.topics}
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="mt-1 text-sm text-slate-400">
                                            Geen extra onderdelen toegevoegd.
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}