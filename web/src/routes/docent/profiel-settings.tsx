import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProfile, getImageUrl, type UserProfile } from "../../lib/api";

export const Route = createFileRoute("/docent/profiel-settings")({
  component: DocentProfielSettingsPage,
});

// Iconen
function UserIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m4 6 8-4 8 4-8 4z" />
      <path d="m18 10 4 2v6" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Uitgebreide interface voor docent-specifieke TS-ondersteuning
type DocentProfile = UserProfile & {
  subject?: string;
  school?: string;
  schoolYear?: string;
  assignedClasses?: string[];
  phone?: string;
};

function DocentProfielSettingsPage() {
  const [profile, setProfile] = useState<DocentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data as DocentProfile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const imageUrl = getImageUrl(profile?.image);
  const firstName = profile?.name?.split(" ")[0] ?? "";

  const assignedClassesText = Array.isArray(profile?.assignedClasses) && profile.assignedClasses.length > 0
    ? profile.assignedClasses.join(", ")
    : "B4";

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      {/* HEADER */}
      <div className="mb-6 flex items-center gap-2">
        <UserIcon />
        <h1 className="text-xl font-bold text-slate-900">Mijn profiel</h1>
      </div>

      {/* CARD CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* PROFIELFOTO SECTIE */}
        <div className="flex flex-col items-center justify-center border-b border-slate-100 py-8">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
            {imageUrl ? (
              <img src={imageUrl} alt="Profiel" className="h-full w-full object-cover" />
            ) : (
              firstName ? firstName[0].toUpperCase() : "D"
            )}
          </div>
        </div>

        {/* DETAILS CONTAINER */}
        <div className="p-6 sm:p-8 space-y-8">
          {loading ? (
            <p className="text-center text-sm text-slate-400">Profielgegevens laden...</p>
          ) : (
            <>
              {/* PERSOONLIJKE GEGEVENS */}
              <div>
                <h2 className="mb-4 text-base font-semibold text-slate-900">Persoonlijke gegevens</h2>
                <div className="space-y-4">
                  {/* Naam */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <UserIcon />
                      <span className="text-sm text-slate-600">Naam</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{profile?.name || "—"}</span>
                      <LockIcon />
                    </div>
                  </div>

                  {/* School e-mailadres */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <MailIcon />
                      <span className="text-sm text-slate-600">School e-mailadres</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{profile?.email || "—"}</span>
                      <LockIcon />
                    </div>
                  </div>

                  {/* Telefoonnummer */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <PhoneIcon />
                      <span className="text-sm text-slate-600">Telefoonnummer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{profile?.phone || "—"}</span>
                      <LockIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* DOCENT- & SCHOOLGEGEVENS */}
              <div>
                <h2 className="mb-4 text-base font-semibold text-slate-900">Docent- & Schoolgegevens</h2>
                <div className="space-y-4">
                  {/* School */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <SchoolIcon />
                      <span className="text-sm text-slate-600">School</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{profile?.school || "—"}</span>
                      <LockIcon />
                    </div>
                  </div>

                  {/* Vak / Expertise */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <BookIcon />
                      <span className="text-sm text-slate-600">Vak / Expertise</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{profile?.subject || "—"}</span>
                      <LockIcon />
                    </div>
                  </div>

                  {/* Huidig schooljaar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <CalendarIcon />
                      <span className="text-sm text-slate-600">Huidig schooljaar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{profile?.schoolYear || "2025-2026"}</span>
                      <LockIcon />
                    </div>
                  </div>

                  {/* Toegewezen klassen */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <UsersIcon />
                      <span className="text-sm text-slate-600">Toegewezen klassen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{assignedClassesText}</span>
                      <LockIcon />
                    </div>
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