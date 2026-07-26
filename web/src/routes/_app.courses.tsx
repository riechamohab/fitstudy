import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  addLesson,
  createCourse,
  getCourses,
  updateLessonProgress,
  type Course,
  type LessonStatus,
} from "../lib/api";

export const Route = createFileRoute("/_app/courses")({
  component: CoursesPage,
});

function statusLabel(status: LessonStatus) {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  return "Not started";
}

function statusBadgeClass(status: LessonStatus) {
  if (status === "COMPLETED") return "bg-green-100 text-green-700";
  if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-500";
}

function CourseCard({
  course,
  onLessonUpdate,
  onAddLesson,
}: {
  course: Course;
  onLessonUpdate: (lessonId: string, status: LessonStatus, progressPercent: number) => void;
  onAddLesson: (courseId: string, title: string) => void;
}) {
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  const totalLessons = course.lessons.length;
  const avgProgress =
    totalLessons > 0
      ? Math.round(
          course.lessons.reduce((sum, l) => sum + l.progressPercent, 0) / totalLessons
        )
      : 0;

  function handleAddLessonSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newLessonTitle.trim()) return;
    onAddLesson(course.id, newLessonTitle.trim());
    setNewLessonTitle("");
    setShowAddLesson(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                course.scope === "class"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              {course.scope === "class" ? course.className : "Personal"}
            </span>
          </div>
          {course.description && (
            <p className="mt-1 text-sm text-slate-500">{course.description}</p>
          )}
        </div>

        {totalLessons > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-900">{avgProgress}%</p>
            <p className="text-xs text-slate-400">overall</p>
          </div>
        )}
      </div>

      {totalLessons > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      )}

      {totalLessons === 0 ? (
        <p className="text-sm text-slate-400">No lessons yet.</p>
      ) : (
        <div className="space-y-2">
          {course.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium text-slate-800">{lesson.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                    lesson.status
                  )}`}
                >
                  {statusLabel(lesson.status)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={lesson.progressPercent}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    const status: LessonStatus =
                      value === 0
                        ? "NOT_STARTED"
                        : value === 100
                        ? "COMPLETED"
                        : "IN_PROGRESS";
                    onLessonUpdate(lesson.id, status, value);
                  }}
                  className="h-1.5 flex-1 accent-blue-600"
                />
                <span className="w-10 text-right text-xs font-medium text-slate-500">
                  {lesson.progressPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {course.isOwner && (
        <div className="mt-3">
          {showAddLesson ? (
            <form onSubmit={handleAddLessonSubmit} className="flex gap-2">
              <input
                autoFocus
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={newLessonTitle}
                onChange={(event) => setNewLessonTitle(event.target.value)}
                placeholder="Lesson name"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddLesson(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddLesson(true)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Add lesson
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadCourses() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleLessonUpdate(
    lessonId: string,
    status: LessonStatus,
    progressPercent: number
  ) {
    setCourses((prev) =>
      prev.map((course) => ({
        ...course,
        lessons: course.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, status, progressPercent } : lesson
        ),
      }))
    );

    try {
      await updateLessonProgress(lessonId, { status, progressPercent });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update progress");
      loadCourses();
    }
  }

  async function handleAddLesson(courseId: string, title: string) {
    try {
      const lesson = await addLesson(courseId, title);
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, lessons: [...course.lessons, lesson] }
            : course
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add lesson");
    }
  }

  async function handleAddCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCourseTitle.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      const course = await createCourse({
        title: newCourseTitle.trim(),
        description: newCourseDescription.trim() || undefined,
      });
      setCourses((prev) => [...prev, course]);
      setNewCourseTitle("");
      setNewCourseDescription("");
      setShowAddCourse(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create course");
    } finally {
      setIsSaving(false);
    }
  }

  const classCourses = courses.filter((c) => c.scope === "class");
  const personalCourses = courses.filter((c) => c.scope === "personal");

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
            <p className="text-sm text-slate-500">
              Your class courses and your own personal study tracks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCourse((v) => !v)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add course
          </button>
        </div>

        {showAddCourse && (
          <form
            onSubmit={handleAddCourse}
            className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={newCourseTitle}
              onChange={(event) => setNewCourseTitle(event.target.value)}
              placeholder="Course title, e.g. Spanish"
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={newCourseDescription}
              onChange={(event) => setNewCourseDescription(event.target.value)}
              placeholder="Description (optional)"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? "Adding..." : "Add course"}
            </button>
          </form>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading courses...</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Class courses
              </h2>
              {classCourses.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No courses assigned by your teacher yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {classCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onLessonUpdate={handleLessonUpdate}
                      onAddLesson={handleAddLesson}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                My courses
              </h2>
              {personalCourses.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You haven't added any personal courses yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {personalCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onLessonUpdate={handleLessonUpdate}
                      onAddLesson={handleAddLesson}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
