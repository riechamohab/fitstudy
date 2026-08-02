import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  getEnrollmentHistory,
  getImageUrl,
  getProfile,
  uploadProfilePicture,
  type EnrollmentEntry,
  type UserProfile,
} from "../lib/api";

export const Route = createFileRoute("/_app/student-profile-settings")({
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
  icon: string;
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>{icon}</span>
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
      try {
        const [profileData, historyData] = await Promise.all([
          getProfile(),
          getEnrollmentHistory(),
        ]);
        setProfile(profileData);
        setHistory(historyData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Kon profiel niet laden"
        );
      } finally {
        setIsLoading(false);
      }
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
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Kon foto niet uploaden"
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
          <span>👤</span> Mijn profiel
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
                  <InfoRow icon="👤" label="Naam" value={profile?.name ?? ""} locked />
                  <InfoRow
                    icon="📧"
                    label="School e-mailadres"
                    value={profile?.email ?? ""}
                    locked
                  />
                  <InfoRow
                    icon="🆔"
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
                  <InfoRow icon="🏫" label="School" value={profile?.school ?? ""} />
                  <InfoRow icon="💻" label="Opleiding" value={profile?.study ?? ""} />
                  <InfoRow
                    icon="📅"
                    label="Huidig schooljaar"
                    value={currentSchoolYear}
                  />
                  <InfoRow
                    icon="👥"
                    label="Klas"
                    value={profile?.studentClass ?? ""}
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
                    Nog geen studiegeschiedenis beschikbaar.
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
                  <span>ℹ️</span>
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

