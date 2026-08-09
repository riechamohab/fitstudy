import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PlannerIcon } from "../../components/ui/icons"; // Of jouw iconen import

// 1. TanStack Router koppeling voor dit bestandspad
export const Route = createFileRoute("/docent/rooster")({
  component: TeacherSchedulePage,
});

interface ScheduleItem {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  location?: string;
}

function TeacherSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Vaste volgorde van dagen om mooi te sorteren
  const daysOrder = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];

  useEffect(() => {
    async function fetchTeacherSchedule() {
      try {
        const response = await fetch("/api/teacher/schedule", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Kon het rooster niet ophalen van de server.");
        }

        const data = await response.json();
        setSchedule(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Er is een fout opgetreden.");
      } finally {
        setLoading(false);
      }
    }

    fetchTeacherSchedule();
  }, []);

  // Sorteer de lessen op dag en starttijd
  const sortedSchedule = [...schedule].sort((a, b) => {
    const dayA = daysOrder.indexOf(a.day);
    const dayB = daysOrder.indexOf(b.day);
    if (dayA !== dayB) return dayA - dayB;
    return a.startTime.localeCompare(b.startTime);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 animate-pulse">Rooster laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        <p>Fout: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-green-600">
          <PlannerIcon />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Mijn Rooster</h1>
      </div>

      {sortedSchedule.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          <p>Er zijn nog geen lessen voor je ingeroosterd door de administratie.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4">Dag</th>
                <th className="p-4">Tijd</th>
                <th className="p-4">Vak</th>
                <th className="p-4">Klas</th>
                <th className="p-4">Locatie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {sortedSchedule.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium text-gray-900">{item.day}</td>
                  <td className="p-4">
                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md font-mono text-xs">
                      {item.startTime} - {item.endTime}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">{item.subject}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {item.className}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{item.location || "N.v.t."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}