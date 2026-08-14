import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  getEnrollmentHistory,
  getImageUrl,
  getProfile,
  uploadProfilePicture,
  type EnrollmentEntry,
  type UserProfile,
} from "../../lib/api";

export const Route = createFileRoute("/student/profiel-settings")({
  component: ProfileSettingsPage,
});

function CameraIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v10A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-10Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M14 10h4M14 14h4" />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
    </svg>
  );
}

function LaptopIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="10" rx="1" />
      <path d="M2 19h20l-2-3H4l-2 3Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 8.5a3 3 0 1 1 3.5 3M19 20a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function getSchoolYearLabel(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
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
        <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
        {locked && <LockIcon />}
      </div>
    </div>
  );
}

function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<EnrollmentEntry[]>([]);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError("");

      // Profiel en studiegeschiedenis worden los van elkaar opgehaald.
      // Zo blokkeert een falende/404 enrollment-history call niet het
      // laden van de rest van het profiel (Promise.all zou dat wel doen,
      // omdat die faalt zodra één van de twee calls faalt).
      try {
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kon profiel niet laden"
        );
      }

      try {
        const historyData = await getEnrollmentHistory();
        setHistory(historyData);
      } catch (err) {
        // Endpoint bestaat (nog) niet / geeft 404 of geen data terug:
        // dit is geen fout voor de gebruiker, gewoon geen geschiedenis.
        setHistory([]);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError("");
    setIsUploadingImage(true);

    try {
      const updated = await uploadProfilePicture(file);
      setProfile(updated);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : "Kon foto niet uploaden"
      );
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  const firstName = profile?.name?.split(" ")[0] ?? "";
  const imageUrl = getImageUrl(profile?.image);
  const currentSchoolYear = getSchoolYearLabel(new Date());

  return (
    <main className="p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <UserIcon /> Mijn profiel
        </h1>

        <div className="rounded-2xl bg-white shadow-xl">
          {isLoading ? (
            <p className="p-7 text-sm text-slate-500">Laden...</p>
          ) : (
            <>
              {/* Profielfoto */}
              <div className="flex flex-col items-center gap-3 border-b border-slate-100 p-7">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-3xl font-semibold text-blue-700">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Profiel"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      firstName ? firstName[0].toUpperCase() : ""
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                    aria-label="Wijzig profielfoto"
                  >
                    <CameraIcon />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
                >
                  {isUploadingImage ? "Uploaden..." : "Wijzig foto"}
                </button>

                {imageError && (
                  <p className="text-xs text-red-600">{imageError}</p>
                )}
              </div>

              {/* Persoonlijke gegevens */}
              <div className="border-b border-slate-100 p-7">
                <p className="mb-1 text-sm font-semibold text-slate-900">
                  Persoonlijke gegevens
                </p>
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={<UserIcon />} label="Naam" value={profile?.name ?? ""} locked />
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
                  <InfoRow
                    icon={<IdCardIcon />}
                    label="Studentnummer"
                    value={profile?.studentId ?? ""}
                    locked
                  />
                </div>
              </div>

              {/* Studiegegevens */}
              <div className="border-b border-slate-100 p-7">
                <p className="mb-1 text-sm font-semibold text-slate-900">
                  Studiegegevens
                </p>
                <div className="divide-y divide-slate-100">
                  <InfoRow
                    icon={<SchoolIcon />}
                    label="School"
                    value={profile?.school ?? ""}
                    locked
                  />
                  <InfoRow
                    icon={<LaptopIcon />}
                    label="Opleiding"
                    value={profile?.study ?? ""}
                    locked
                  />
                  <InfoRow
                    icon={<CalendarIcon />}
                    label="Huidig schooljaar"
                    value={currentSchoolYear}
                    locked
                  />
                  <InfoRow
                    icon={<UsersIcon />}
                    label="Klas"
                    value={profile?.studentClass ?? ""}
                    locked
                  />
                </div>
              </div>

              {/* Studiegeschiedenis */}
              <div className="border-b border-slate-100 p-7">
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Studiegeschiedenis
                </p>

                {history.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Geen studie geschiedenis om weer te geven.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          {entry.schoolYear} &nbsp; {entry.className}
                        </span>
                        {entry.status === "CURRENT" ? (
                          <span className="flex items-center gap-1 font-medium text-green-600">
                            🟢 Huidig
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500">
                            ✔ Behaald
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info footer */}
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
                      Je persoonlijke gegevens worden beheerd door de
                      schooladministratie. Neem contact op met de
                      administratie om wijzigingen door te geven.
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