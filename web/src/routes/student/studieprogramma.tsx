import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  getClassSchedule,
  getCourses,
  toggleLessonItem,
  type ClassScheduleResponse,
  type Course,
  type Lesson,
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

function getSchoolYearLabel(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

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

function DonutChart({
  percent,
  size = 64,
  strokeWidth = 8,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const color = percent === 100 ? "#16a34a" : "#2563eb";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 4.2}
        fontWeight="bold"
        fill="#0f172a"
      >
        {percent}%
      </text>
    </svg>
  );
}

function lessonAverage(lessons: Lesson[]) {
  if (lessons.length === 0) return 0;
  return Math.round(lessons.reduce((sum, l) => sum + l.progressPercent, 0) / lessons.length);
}

function LessonDetail({
  lesson,
  onToggleItem,
}: {
  lesson: Lesson;
  onToggleItem: (itemId: string, completed: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <DonutChart percent={lesson.progressPercent} />

      <div className="flex-1">
        {lesson.items.length === 0 ? (
          <p className="text-sm text-slate-400">
            Je docent heeft nog geen onderdelen toegevoegd voor deze les.
          </p>
        ) : (
          <div className="space-y-1.5">
            {lesson.items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(event) => onToggleItem(item.id, event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className={item.completed ? "text-slate-400 line-through" : "text-slate-700"}>
                  {item.title}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseDetail({
  course,
  expandedLessonIds,
  onToggleLesson,
  onToggleItem,
}: {
  course: Course;
  expandedLessonIds: Set<string>;
  onToggleLesson: (lessonId: string) => void;
  onToggleItem: (itemId: string, completed: boolean) => void;
}) {
  const allLessons = [...course.chapters.flatMap((ch) => ch.lessons), ...course.lessons];

  if (allLessons.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Je docent heeft nog geen hoofdstukken of lessen toegevoegd.
      </p>
    );
  }

  function LessonRow({ lesson }: { lesson: Lesson }) {
    const isOpen = expandedLessonIds.has(lesson.id);
    return (
      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => onToggleLesson(lesson.id)}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
        >
          <span className="text-sm font-medium text-slate-800">{lesson.title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{lesson.progressPercent}%</span>
            <ChevronDownIcon open={isOpen} />
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-slate-100 p-3">
            <LessonDetail lesson={lesson} onToggleItem={onToggleItem} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {course.chapters.map((chapter) => (
        <div key={chapter.id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {chapter.title}
          </p>
          <div className="space-y-2">
            {chapter.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      ))}

      {course.lessons.length > 0 && (
        <div>
          {course.chapters.length > 0 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Overig
            </p>
          )}
          <div className="space-y-2">
            {course.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      )}
    </div>
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
                    if (e.day.toLowerCase() !== day.value) return false;
                    const entryStart = e.startTime.trim().substring(0, 5);
                    return entryStart === block.start;
                  });

                  return (
                    <td key={`${day.value}-${block.id}`} className="border-b border-slate-100 p-2">
                      {entry ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="font-semibold text-slate-900">{entry.subject}</p>
                          {entry.teacherName && (
                            <p className="mt-0.5 text-xs text-slate-500">{entry.teacherName}</p>
                          )}
                          {entry.location && (
                            <p className="mt-0.5 text-xs text-slate-400">{entry.location}</p>
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ClassScheduleResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<string>>(new Set());

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const [coursesData, scheduleData] = await Promise.all([
        getCourses(),
        getClassSchedule(),
      ]);
      setCourses(coursesData.filter((c) => c.scope === "class"));
      setSchedule(scheduleData);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon gegevens niet laden");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleCourse(courseId: string) {
    setExpandedCourseId((prev) => (prev === courseId ? null : courseId));
  }

  function toggleLessonOpen(lessonId: string) {
    setExpandedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }

  async function handleToggleItem(itemId: string, completed: boolean) {
    setCourses((prev) =>
      prev.map((course) => ({
        ...course,
        chapters: course.chapters.map((chapter) => ({
          ...chapter,
          lessons: chapter.lessons.map((lesson) => updateLessonItem(lesson, itemId, completed)),
        })),
        lessons: course.lessons.map((lesson) => updateLessonItem(lesson, itemId, completed)),
      }))
    );

    try {
      await toggleLessonItem(itemId, completed);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon onderdeel niet bijwerken");
      loadData();
    }
  }

  function updateLessonItem(lesson: Lesson, itemId: string, completed: boolean): Lesson {
    if (!lesson.items.some((i) => i.id === itemId)) return lesson;
    const items = lesson.items.map((i) => (i.id === itemId ? { ...i, completed } : i));
    const checkedCount = items.filter((i) => i.completed).length;
    const progressPercent = Math.round((checkedCount / items.length) * 100);
    const status =
      checkedCount === 0 ? "NOT_STARTED" : checkedCount === items.length ? "COMPLETED" : "IN_PROGRESS";
    return { ...lesson, items, progressPercent, status };
  }

  const schoolYear = getSchoolYearLabel(new Date());
  const hasScheduleEntries = (schedule?.entries.length ?? 0) > 0;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Lesrooster{schedule?.className ? ` klas ${schedule.className}` : ""} (schooljaar{" "}
            {schoolYear})
          </h1>

          {isLoading ? (
            <p className="mt-3 text-sm text-slate-500">Lesrooster laden...</p>
          ) : !schedule?.className ? (
            <p className="mt-3 text-sm text-slate-400">
              Er is nog geen klas aan je account gekoppeld.
            </p>
          ) : !hasScheduleEntries ? (
            <p className="mt-3 text-sm text-slate-400">
              De administratie heeft nog geen lesrooster geplaatst voor jouw klas.
            </p>
          ) : (
            <ScheduleGrid schedule={schedule} />
          )}
        </div>

        <div>
          <h2 className="mb-1 text-2xl font-bold text-slate-900">Studieprogramma</h2>
          <p className="mb-4 text-sm text-slate-500">
            Klik op een vak om de hoofdstukken, lessen en je voortgang te zien.
          </p>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          {isLoading ? (
            <p className="text-sm text-slate-500">Studieprogramma laden...</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-slate-400">
              Je docent heeft nog geen studieprogramma geplaatst.
            </p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const isOpen = expandedCourseId === course.id;
                const allLessons = [
                  ...course.chapters.flatMap((ch) => ch.lessons),
                  ...course.lessons,
                ];

                return (
                  <div key={course.id} className="rounded-xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => toggleCourse(course.id)}
                      className="flex w-full items-center justify-between gap-3 p-5 text-left"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                        {course.description && (
                          <p className="mt-0.5 text-sm text-slate-500">{course.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {isOpen && allLessons.length > 0 && (
                          <span className="text-sm font-semibold text-slate-500">
                            {lessonAverage(allLessons)}% totaal
                          </span>
                        )}
                        <ChevronDownIcon open={isOpen} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 p-5">
                        <CourseDetail
                          course={course}
                          expandedLessonIds={expandedLessonIds}
                          onToggleLesson={toggleLessonOpen}
                          onToggleItem={handleToggleItem}
                        />
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
