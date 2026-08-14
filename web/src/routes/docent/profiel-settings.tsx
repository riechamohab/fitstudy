import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  getProfile,
  type UserProfile,
} from "../../lib/api";

export const Route = createFileRoute("/docent/profiel-settings")({
  component: ProfileSettingsPage,
});

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 8.5a3 3 0 1 1 3.5 3M19 20a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function InfoRow({
  icon,
  label,
  value,
  locked,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">
          {value || "—"}
        </span>

        {locked && <LockIcon />}
      </div>
    </div>
  );
}

function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Kon profiel niet laden"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const subjects = profile?.subjects ?? [];

  const isMentor =
    Boolean(profile?.mentorClassName) &&
    profile?.mentorClassName !== "";

  return (
    <main className="p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <UserIcon />
          Mijn profiel
        </h1>

        <div className="rounded-2xl bg-white shadow-xl">
          {isLoading ? (
            <p className="p-7 text-sm text-slate-500">
              Laden...
            </p>
          ) : (
            <>
              {/* Persoonlijke gegevens */}
              <div className="border-b border-slate-100 p-7">
                <p className="mb-1 text-sm font-semibold text-slate-900">
                  Persoonlijke gegevens
                </p>

                <div className="divide-y divide-slate-100">
                  <InfoRow
                    icon={<UserIcon />}
                    label="Naam"
                    value={profile?.name ?? ""}
                    locked
                  />

                  <InfoRow
                    icon={<MailIcon />}
                    label="School e-mailadres"
                    value={profile?.email ?? ""}
                    locked
                  />

                  <InfoRow
                    icon={<PhoneIcon />}
                    label="Telefoonnummer"
                    value={profile?.phoneNumber ?? ""}
                    locked
                  />
                </div>
              </div>

              {/* Vakken */}
              <div className="border-b border-slate-100 p-7">
                <div className="mb-3 flex items-center gap-2">
                  <BookIcon />

                  <p className="text-sm font-semibold text-slate-900">
                    Vakken
                  </p>
                </div>

                {subjects.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Geen vakken toegewezen.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject}
                        className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mentor */}
              <div className="border-b border-slate-100 p-7">
                <div className="mb-3 flex items-center gap-2">
                  <UsersIcon />

                  <p className="text-sm font-semibold text-slate-900">
                    Mentor
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 px-4 py-3">
                  {isMentor ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          Mentorklas
                        </p>

                        <p className="mt-1 text-sm font-semibold text-blue-700">
                          {profile?.mentorClassName}
                        </p>
                      </div>

                      {profile?.mentorSchoolYear && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <CalendarIcon />

                          <span>
                            {profile.mentorSchoolYear}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-blue-600">
                      —
                    </p>
                  )}
                </div>
              </div>

              {/* Foutmelding */}
              <div className="p-7">
                {error && (
                  <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 rounded-lg bg-slate-50 p-4">
                  <InfoIcon />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Gegevens onjuist?
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Indien er fouten staan in de gegevens die
                      hierboven zijn ingevoerd, neem dan contact
                      op met de administratie van de school om
                      deze gegevens te laten wijzigen.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}