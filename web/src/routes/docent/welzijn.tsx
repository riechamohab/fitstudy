import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProgressIcon } from "../../components/ui/icons";

export const Route = createFileRoute("/docent/welzijn")({
  component: TeacherWelcomingPage,
});

interface StudentWelbeingItem {
  student: {
    id: string;
    name: string;
    email: string;
    className: string | null;
  };
  stressStats: {
    avgLevel: number;
    avgFocus: number;
    entries: number;
  };
  exerciseStats: {
    total: number;
    completed: number;
    totalMinutes: number;
  };
}

interface MentorClassResponse {
  isMentor: boolean;
  className?: string;
  students?: StudentWelbeingItem[];
}

function TeacherWelcomingPage() {
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState<MentorClassResponse | null>(null);

  useEffect(() => {
    fetchMentorWelbeingData();
  }, []);

  async function fetchMentorWelbeingData() {
    try {
      setLoading(true);
      
      const res = await fetch("/api/teacher/mentor-welbeing", { credentials: "include" });
      
      if (!res.ok) {
        setMentorData({ isMentor: false });
        return;
      }
      
      const data = await res.json();
      setMentorData(data);
    } catch {
      setMentorData({ isMentor: false });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-gray-500 animate-pulse">Welzijn rapporten laden...</p>
      </div>
    );
  }

  if (!mentorData || !mentorData.isMentor || !mentorData.students || mentorData.students.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-green-600">
            <ProgressIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Studenten Welzijn</h1>
            <p className="text-gray-500 text-sm">Overzicht van het welzijn en de stressniveaus van je mentorklas.</p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-xl shadow-sm border text-center text-gray-500">
          <p className="text-lg font-medium">Geen welzijn rapporten op te halen.</p>
          <p className="text-sm text-gray-400 mt-1">Je bent momenteel niet ingesteld als mentor van een klas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-green-600">
            <ProgressIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Studenten Welzijn</h1>
            <p className="text-gray-500 text-sm">
              Mentorklas overzicht: <span className="font-semibold text-gray-700">Klas {mentorData.className}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase">
            <tr>
              <th className="p-4">Studentnaam</th>
              <th className="p-4">E-mailadres</th>
              <th className="p-4 text-center">Gem. Stressniveau</th>
              <th className="p-4 text-center">Gem. Focus</th>
              <th className="p-4 text-center">Activiteit Minuten</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {mentorData.students.map((item) => {
              const { student, stressStats, exerciseStats } = item;
              const stressLevel = stressStats.avgLevel || 0;

              return (
                <tr key={student.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium text-gray-900">{student.name}</td>
                  <td className="p-4 text-gray-500">{student.email}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md font-bold text-xs inline-block ${
                        stressLevel > 3
                          ? "bg-red-100 text-red-800"
                          : stressLevel > 2
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {stressLevel ? stressLevel.toFixed(1) : "N.v.t."}
                    </span>
                  </td>
                  <td className="p-4 text-center font-semibold text-gray-700">
                    {stressStats.avgFocus ? `${stressStats.avgFocus.toFixed(1)} / 5` : "-"}
                  </td>
                  <td className="p-4 text-center text-gray-600">
                    {exerciseStats.totalMinutes ? `${exerciseStats.totalMinutes} min` : "0 min"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}