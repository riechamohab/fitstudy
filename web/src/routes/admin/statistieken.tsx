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
    { label: "Studenten", value: studentCount, accent: "bg-blue-50 text-blue-700" },
    { label: "Docenten", value: teacherCount, accent: "bg-emerald-50 text-emerald-700" },
    { label: "Admins", value: adminCount, accent: "bg-purple-50 text-purple-700" },
    { label: "Totaal gebruikers", value: totalCount, accent: "bg-slate-50 text-slate-700" },
  ];

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Statistieken</h1>
      <p className="mt-1 text-sm text-slate-500">
        Overzicht van het aantal gebruikers in het systeem.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-500">Statistieken laden...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
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
      )}
    </main>
  );
}

