import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/student-schedule")({
  component: StudentSchedulePage,
});

type Schedule = {
  id: string;
  title: string;
  role: string;
  day: string;
  date: string | null;
  startTime: string;
  endTime: string;
  location: string;
  subject: string;
};

function StudentSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/schedule",
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        setSchedules(data);
      } catch (error) {
        console.error("Schedule loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Mijn rooster
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Bekijk je lessen en planning.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-slate-500">
          Rooster laden...
        </p>
      )}

      {!loading && schedules.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">
            Nog geen rooster beschikbaar
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Je rooster verschijnt hier zodra het is toegevoegd.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {schedules.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold text-slate-900">
              {item.subject}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {item.title}
            </p>

            <div className="mt-3 space-y-1 text-sm text-slate-500">
              <p>
                📅 {item.day}
              </p>

              <p>
                ⏰ {item.startTime} - {item.endTime}
              </p>

              <p>
                📍 {item.location}
              </p>

              <p>
                👥 {item.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}