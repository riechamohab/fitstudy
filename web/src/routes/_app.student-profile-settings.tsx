import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  getImageUrl,
  getProfile,
  uploadProfilePicture,
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

function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load profile"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
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
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  const firstName = profile?.name?.split(" ")[0] ?? "";
  const imageUrl = getImageUrl(profile?.image);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-7 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Your information</h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep your school and contact details up to date.
          </p>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading...</p>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-semibold text-blue-700">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Profile"
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
                    aria-label="Change profile picture"
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

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Profiel foto
                  </p>
                  <p className="text-xs text-slate-500">
                    {isUploadingImage
                      ? "Uploading..."
                      : "JPG or PNG, up to 5MB."}
                  </p>
                  {imageError && (
                    <p className="mt-1 text-xs text-red-600">{imageError}</p>
                  )}
                </div>
              </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Volledig Naam
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                    type="text"
                    value={profile?.name ?? ""}
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    E-mail Adres
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                    type="email"
                    value={profile?.email ?? ""}
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    School
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    type="text"
                    value={profile?.school ?? ""}
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Studie Richting
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    type="text"
                    value={profile?.study ?? ""}
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Klas
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    type="text"
                    value={profile?.studentClass ?? ""}
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Mobiel Nummer
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    type="tel"
                    value={profile?.phoneNumber ?? ""}
                    disabled
                  />
                </div>

            </>
          )}
        </div>
      </div>
    </main>
  );
}
