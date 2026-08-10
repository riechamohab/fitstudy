import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PlannerIcon } from "../../components/ui/icons";
import { getTeacherSchedule, type Schedule } from "../../lib/api";

export const Route = createFileRoute("/docent/rooster")({
  component: TeacherSchedulePage,
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

function TeacherSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeacherSchedule() {
      try {
        const data = await getTeacherSchedule();
        setSchedule(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Er is een fout opgetreden.");
      } finally {
        setLoading(false);
      }
    }

    fetchTeacherSchedule();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="animate-pulse text-gray-500">Rooster laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <p>Fout: {error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="text-green-600">
          <PlannerIcon />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Mijn Rooster</h1>
      </div>

      {schedule.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500 shadow-sm">
          <p>Er zijn nog geen lessen voor je ingeroosterd door de administratie.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-28 border-b bg-gray-50 p-3 text-left text-xs font-medium uppercase text-gray-500">
                  Tijdsblok
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.value}
                    className="border-b bg-gray-50 p-3 text-left text-xs font-medium uppercase text-gray-500"
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
                    <tr key={block.id} className="bg-gray-50">
                      <td
                        colSpan={DAYS.length + 1}
                        className="p-2 text-center text-xs font-medium text-gray-400"
                      >
                        {block.label} ({block.start} - {block.end})
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={block.id} className="align-top">
                    <td className="border-b p-3 text-xs text-gray-500">
                      {block.label}
                      <br />
                      {block.start} - {block.end}
                    </td>
                    {DAYS.map((day) => {
                      const entry = schedule.find((s) => {
                        if (s.day.toLowerCase() !== day.value) return false;
                        const entryStart = s.startTime.trim().substring(0, 5);
                        return entryStart === block.start;
                      });

                      return (
                        <td key={`${day.value}-${block.id}`} className="border-b p-3">
                          {entry ? (
                            <div>
                              <p className="font-semibold text-gray-900">{entry.subject}</p>
                              <p className="mt-1">
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                  {entry.className}
                                </span>
                              </p>
                              {entry.location && (
                                <p className="mt-1 text-xs text-gray-400">{entry.location}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">
                              Geen les te verzorgen
                            </span>
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
      )}
    </div>
  );
}
