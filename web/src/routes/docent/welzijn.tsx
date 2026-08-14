import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProgressIcon } from "../../components/ui/icons";
import { API_BASE_URL } from "../../lib/api";

export const Route = createFileRoute("/docent/welzijn")({
  component: TeacherWellbeingPage,
});

type WellbeingStatus = "healthy" | "at_risk" | "critical" | "unknown";

interface StressEntry {
  id: string;
  userId: string;
  level: number;
  focus: number;
  sleepHours: number | null;
  notes: string | null;
  createdAt: string;
}

interface StudentWellbeingItem {
  student: {
    id: string;
    name: string;
    email: string;
    className: string | null;
  };
  wellbeingStatus: {
    status: WellbeingStatus;
    avgStress: number | null;
    avgFocus: number | null;
    avgSleep: number | null;
    entries: number;
    latestEntry: StressEntry | null;
  };
  exerciseStats: {
    total: number;
    completed: number;
    totalMinutes: number;
  };
  latestEntries: StressEntry[];
}

interface MentorClassResponse {
  isMentor: boolean;
  className?: string;
  students?: StudentWellbeingItem[];
}

function statusMeta(status: WellbeingStatus) {
  switch (status) {
    case "healthy":
      return {
        label: "Gezond",
        bg: "bg-green-100",
        text: "text-green-700",
        dot: "bg-green-500",
      };
    case "at_risk":
      return {
        label: "Risico",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      };
    case "critical":
      return {
        label: "Kritiek",
        bg: "bg-red-100",
        text: "text-red-700",
        dot: "bg-red-500",
      };
    default:
      return {
        label: "Onbekend",
        bg: "bg-slate-100",
        text: "text-slate-500",
        dot: "bg-slate-400",
      };
  }
}

function StatusBadge({ status }: { status: WellbeingStatus }) {
  const meta = statusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.bg} ${meta.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function TeacherWellbeingPage() {
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState<MentorClassResponse | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWellbeingItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMentorWellbeingData();
  }, []);

  async function fetchMentorWellbeingData() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/teacher/mentor-welbeing`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Geen welzijn rapporten op te halen.");
      }

      const data = await res.json();
      setMentorData(data);

      if (data.students && data.students.length > 0) {
        setSelectedStudent(data.students[0]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Geen welzijn rapporten op te halen."
      );
      setMentorData({ isMentor: false, students: [] });
    } finally {
      setLoading(false);
    }
  }

  const students = mentorData?.students ?? [];

  const criticalCount = students.filter(
    (item) => item.wellbeingStatus.status === "critical"
  ).length;

  const riskCount = students.filter(
    (item) => item.wellbeingStatus.status === "at_risk"
  ).length;

  const healthyCount = students.filter(
    (item) => item.wellbeingStatus.status === "healthy"
  ).length;

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-gray-500 animate-pulse">
          Welzijn rapporten laden...
        </p>
      </div>
    );
  }

  if (!mentorData || !mentorData.isMentor || students.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-blue-600">
            <ProgressIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Studenten Welzijn
            </h1>
            <p className="text-gray-500 text-sm">
              Overzicht van het welzijn en de stressniveaus van je klas.
            </p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-xl shadow-sm border text-center text-gray-500">
          <p className="text-lg font-medium">
            Geen welzijnsrapporten beschikbaar.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            U bent momenteel niet ingesteld als mentor van een klas.
          </p>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-blue-600">
            <ProgressIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Studenten Welzijn
            </h1>
            <p className="text-gray-500 text-sm">
              Welzijnsoverzicht van klas{" "}
              <span className="font-semibold text-gray-700">
                {mentorData.className}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500 font-medium">Gezond</p>
          <h3 className="text-2xl font-bold text-green-600">{healthyCount}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500 font-medium">Risico</p>
          <h3 className="text-2xl font-bold text-yellow-600">{riskCount}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500 font-medium">Kritiek</p>
          <h3 className="text-2xl font-bold text-red-600">{criticalCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow-sm border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-4">Studentnaam</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Gem. stress</th>
                <th className="p-4 text-center">Gem. slaap</th>
                <th className="p-4 text-center">Registraties</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {students.map((item) => {
                const { student, wellbeingStatus } = item;
                const isSelected = selectedStudent?.student.id === student.id;

                return (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(item)}
                    className={`cursor-pointer transition hover:bg-blue-50/50 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="p-4">
                      <p className="font-medium text-gray-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={wellbeingStatus.status} />
                    </td>

                    <td className="p-4 text-center font-semibold text-gray-700">
                      {wellbeingStatus.avgStress !== null
                        ? `${wellbeingStatus.avgStress.toFixed(1)} / 10`
                        : "-"}
                    </td>

                    <td className="p-4 text-center font-semibold text-gray-700">
                      {wellbeingStatus.avgSleep !== null
                        ? `${wellbeingStatus.avgSleep.toFixed(1)} u`
                        : "-"}
                    </td>

                    <td className="p-4 text-center text-gray-600">
                      {wellbeingStatus.entries}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white shadow-sm border rounded-xl p-5">
          {!selectedStudent ? (
            <p className="text-sm text-gray-500">
              Klik op een student om details te bekijken.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Studentdetails
                </p>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedStudent.student.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Klas {selectedStudent.student.className ?? "-"}
                </p>
              </div>

              <div className="mb-5">
                <StatusBadge
                  status={selectedStudent.wellbeingStatus.status}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Gem. stress</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStudent.wellbeingStatus.avgStress !== null
                      ? selectedStudent.wellbeingStatus.avgStress.toFixed(1)
                      : "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Gem. focus</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStudent.wellbeingStatus.avgFocus !== null
                      ? selectedStudent.wellbeingStatus.avgFocus.toFixed(1)
                      : "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Gem. slaap</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStudent.wellbeingStatus.avgSleep !== null
                      ? `${selectedStudent.wellbeingStatus.avgSleep.toFixed(
                          1
                        )} u`
                      : "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Activiteit</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedStudent.exerciseStats.totalMinutes} min
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800">
                  Laatste registraties
                </p>

                {selectedStudent.latestEntries.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Nog geen registraties.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.latestEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-slate-700">
                            {new Date(entry.createdAt).toLocaleDateString(
                              "nl-NL"
                            )}
                          </span>
                          <span className="text-xs text-slate-400">
                            Stress {entry.level}/10
                          </span>
                        </div>

                        <p className="text-xs text-slate-500">
                          Focus: {entry.focus}/10 • Slaap:{" "}
                          {entry.sleepHours ?? "-"} u
                        </p>

                        {entry.notes && (
                          <p className="mt-1 text-xs text-slate-500">
                            Notitie: {entry.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}