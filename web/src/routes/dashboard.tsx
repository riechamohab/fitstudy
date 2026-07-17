import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getProfile, type UserProfile } from "../lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load profile"
        );
      }
    }

    loadProfile();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          FitStudy Dashboard
        </h1>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {profile ? (
          <div className="space-y-2 text-slate-700">
            <p>
              <strong>Naam:</strong> {profile.name}
            </p>
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
            <p>
              <strong>User ID:</strong> {profile.id}
            </p>
          </div>
        ) : (
          <p className="text-slate-600">Profiel laden...</p>
        )}
      </section>
    </main>
  );
}