import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getNotes, markNoteRead, type TeacherNote } from "../../lib/api";
import {
  disableBrowserNotifications,
  enableBrowserNotifications,
  isBrowserNotificationsEnabled,
  isNotificationApiSupported,
} from "../../lib/browserNotifications";

export const Route = createFileRoute("/student/notities")({
  component: NotesPage,
});

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotesPage() {
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [popupsEnabled, setPopupsEnabled] = useState(false);
  const [isTogglingPopups, setIsTogglingPopups] = useState(false);

  async function loadNotes() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kon notities niet laden");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
    setPopupsEnabled(isBrowserNotificationsEnabled());
  }, []);

  async function handleTogglePopups() {
    setIsTogglingPopups(true);
    try {
      if (popupsEnabled) {
        disableBrowserNotifications();
        setPopupsEnabled(false);
      } else {
        const granted = await enableBrowserNotifications();
        setPopupsEnabled(granted);
        if (!granted) {
          setError(
            "Toestemming voor meldingen is geweigerd. Je kan dit aanpassen in je browserinstellingen."
          );
        }
      }
    } finally {
      setIsTogglingPopups(false);
    }
  }

  async function handleOpenNote(note: TeacherNote) {
    if (note.read) return;

    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)));

    try {
      await markNoteRead(note.id);
    } catch {
      loadNotes();
    }
  }

  return (
    <main className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notities</h1>
            <p className="text-sm text-slate-500">Berichten van je docent(en).</p>
          </div>
        </div>

        {isNotificationApiSupported() && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <BellIcon />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Pop-upmeldingen in browser
                </p>
                <p className="text-xs text-slate-500">
                  Krijg een melding in je browser zodra er een nieuwe notitie is.
                </p>
              </div>
            </div>

            <button
            type="button"
            onClick={handleTogglePopups}
            disabled={isTogglingPopups}
            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${
              popupsEnabled ? "bg-blue-600" : "bg-slate-300"
            }`}
            aria-label="Pop-upmeldingen aan/uit"
            >
              <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                popupsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
              />
              </button>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Notities laden...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-slate-400">Je hebt nog geen notities ontvangen.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => handleOpenNote(note)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  note.read
                    ? "border-slate-200 bg-white"
                    : "border-blue-300 bg-blue-50/50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {formatDateTime(note.createdAt)}
                  </span>
                  {!note.read && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Nieuw
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800">{note.message}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
