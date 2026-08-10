import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getAdminUsers, type AdminUser } from "../../lib/api";

export const Route = createFileRoute("/admin/statistieken")({
  component: AdminStatistiekenPage,
});

type StatCard = {
  label: string;
  value: number;
  accent: string;
  barColor: string;
};

function AdminStatistiekenPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon statistieken niet ophalen.");
    } finally {
      setLoading(false);
    }
  }

  const studentCount = users.filter((u) => u.role === "student").length;
  const teacherCount = users.filter((u) => u.role === "teacher").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalCount = users.length;

  const cards: StatCard[] = [
    { label: "Studenten", value: studentCount, accent: "bg-blue-50 text-blue-700", barColor: "fill-blue-600" },
    { label: "Docenten", value: teacherCount, accent: "bg-emerald-50 text-emerald-700", barColor: "fill-emerald-600" },
    { label: "Admins", value: adminCount, accent: "bg-purple-50 text-purple-700", barColor: "fill-purple-600" },
    { label: "Totaal", value: totalCount, accent: "bg-slate-50 text-slate-700", barColor: "fill-slate-600" },
  ];

  const maxVal = Math.max(totalCount, 10);
  const chartHeight = 160;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Statistieken</h1>
      <p className="mt-1 text-sm text-slate-500">
        Overzicht van het aantal gebruikers in het systeem.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-500">Statistieken laden...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {/* Kaarten */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className={`mt-2 inline-block rounded-lg px-2 py-1 text-3xl font-bold ${card.accent}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Staafdiagram */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Gebruikersvisualisatie</h2>
            <p className="text-sm text-slate-500 mb-6">Grafische weergave van de verschillende gebruikersrollen.</p>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 550 220" className="w-full h-auto min-w-[500px]">
                {/* Horizontale hulplijnen */}
                <line x1="30" y1="30" x2="520" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="75" x2="520" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="120" x2="520" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="165" x2="520" y2="165" stroke="#cbd5e1" strokeWidth="1" />

                {/* Staven en labels */}
                {cards.map((card, idx) => {
                  const barHeight = (card.value / maxVal) * chartHeight;
                  const x = 70 + idx * 115;
                  const y = 165 - barHeight;

                  return (
                    <g key={card.label}>
                      {/* De staaf */}
                      <rect
                        x={x}
                        y={y}
                        width="60"
                        height={barHeight}
                        rx="6"
                        className={`${card.barColor} transition-all duration-300`}
                      />
                      {/* Waarde boven de staaf */}
                      <text
                        x={x + 30}
                        y={y - 8}
                        textAnchor="middle"
                        className="text-xs font-bold fill-slate-700"
                        fontSize="12"
                      >
                        {card.value}
                      </text>
                      {/* Label onder de staaf */}
                      <text
                        x={x + 30}
                        y="188"
                        textAnchor="middle"
                        className="text-xs font-medium fill-slate-500"
                        fontSize="12"
                      >
                        {card.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </>
      )}
    </main>
  );
}