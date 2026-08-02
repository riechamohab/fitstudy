import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  getGrades,
  getMonthlyProgress,
  getProgressExportUrl,
  type Grade,
  type MonthlyProgress,
} from "../lib/api";

export const Route = createFileRoute("/_app/student-progress")({
  component: ProgressPage,
});

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function ProgressPage() {
  const [monthly, setMonthly] = useState<MonthlyProgress | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [monthlyData, gradesData] = await Promise.all([
          getMonthlyProgress(),
          getGrades(),
        ]);
        setMonthly(monthlyData);
        setGrades(gradesData);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load progress");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handleDownload() {
    window.open(getProgressExportUrl(), "_blank");
  }

  const changePercent = monthly?.grades.changePercent ?? null;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Progress</h1>
            <p className="text-sm text-slate-500">
              {monthly ? monthly.month : "This month"} at a glance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <DownloadIcon />
            Download report
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading progress...</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  {monthly?.focusSessions.total ?? 0}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Focus sessions
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  {monthly?.focusSessions.shortBreaks ?? 0}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Short breaks
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  {monthly?.focusSessions.longBreaks ?? 0}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Long breaks
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  {monthly?.tasks.completed ?? 0}/{monthly?.tasks.total ?? 0}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tasks completed
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-4 text-sm font-semibold text-slate-900">Grades</p>

              {monthly?.grades.thisMonthAvg === null && monthly?.grades.overallAvg === null ? (
                <p className="text-sm text-slate-400">No grades recorded yet.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-6">
                  {monthly?.grades.thisMonthAvg !== null ? (
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        {monthly?.grades.thisMonthAvg}%
                      </p>
                      <p className="text-xs text-slate-500">average this month</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No grades this month yet.</p>
                  )}

                  {monthly?.grades.overallAvg !== null && (
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        {monthly?.grades.overallAvg}%
                      </p>
                      <p className="text-xs text-slate-500">overall average</p>
                    </div>
                  )}

                  {changePercent !== null && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        changePercent >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {changePercent >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      {Math.abs(changePercent)}% vs last month
                    </span>
                  )}
                </div>
              )}

              {grades.length > 0 && (
                <div className="mt-5 space-y-2">
                  {grades.slice(0, 5).map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">{grade.subject}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {new Date(grade.gradedAt).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-slate-900">{grade.score}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-1 text-sm font-semibold text-slate-900">
                School year overview
              </p>
              <p className="mb-4 text-xs text-slate-500">
                Every grade recorded this school year, most recent first.
              </p>

              {grades.length === 0 ? (
                <p className="text-sm text-slate-400">No grades recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">{grade.subject}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {new Date(grade.gradedAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-semibold text-slate-900">{grade.score}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="mb-1 text-sm font-semibold text-slate-900">
                Task completion rate
              </p>
              <p className="mb-3 text-xs text-slate-500">This month</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${monthly?.tasks.completionRate ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {monthly?.tasks.completionRate ?? 0}%
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
