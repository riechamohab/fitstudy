import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { createMededeling } from "../../lib/api";

export const Route = createFileRoute("/admin/mededelingen")({
  component: AdminMededelingenPage,
});

type TargetAudience = "teachers" | "students" | "both";
type Priority = "low" | "normal" | "high" | "urgent";

function AdminMededelingenPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [target, setTarget] =
    useState<TargetAudience>("both");

  const [priority, setPriority] =
    useState<Priority>("normal");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [formSuccess, setFormSuccess] =
    useState<string | null>(null);

  async function handleSubmitMededeling(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError(
        "Vul een titel in voor de mededeling."
      );
      return;
    }

    if (!message.trim()) {
      setFormError(
        "Vul de inhoud van de mededeling in."
      );
      return;
    }

    setSubmitting(true);

    try {
      await createMededeling({
        title: title.trim(),
        message: message.trim(),
        target,
        priority,
      });

      setFormSuccess(
        target === "students"
          ? "Mededeling is succesvol naar alle studenten verzonden!"
          : target === "teachers"
            ? "Mededeling is succesvol naar alle docenten verzonden!"
            : "Mededeling is succesvol naar studenten en docenten verzonden!"
      );

      setTitle("");
      setMessage("");
      setTarget("both");
      setPriority("normal");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Kon de mededeling niet versturen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Hoofdkaart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Titel */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Mededelingenbeheer
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Verstuur algemene schoolmededelingen naar
              studenten, docenten of beide.
            </p>
          </div>

          {/* Error */}
          {formError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Success */}
          {formSuccess && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {formSuccess}
            </div>
          )}

          <form
            onSubmit={handleSubmitMededeling}
            className="space-y-6"
          >
            {/* Doelgroep */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Ontvangers
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Studenten */}
                <button
                  type="button"
                  onClick={() =>
                    setTarget("students")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    target === "students"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Alleen studenten
                </button>

                {/* Docenten */}
                <button
                  type="button"
                  onClick={() =>
                    setTarget("teachers")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    target === "teachers"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Alleen docenten
                </button>

                {/* Beide */}
                <button
                  type="button"
                  onClick={() =>
                    setTarget("both")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    target === "both"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Studenten & Docenten
                </button>
              </div>
            </div>

            {/* Prioriteit */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Prioriteit
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Laag */}
                <button
                  type="button"
                  onClick={() =>
                    setPriority("low")
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    priority === "low"
                      ? "border-slate-600 bg-slate-100 text-slate-800"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Laag
                </button>

                {/* Normaal */}
                <button
                  type="button"
                  onClick={() =>
                    setPriority("normal")
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    priority === "normal"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Normaal
                </button>

                {/* Hoog */}
                <button
                  type="button"
                  onClick={() =>
                    setPriority("high")
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    priority === "high"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Hoog
                </button>

                {/* Urgent */}
                <button
                  type="button"
                  onClick={() =>
                    setPriority("urgent")
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    priority === "urgent"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Urgent
                </button>
              </div>
            </div>

            {/* Titel */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Titel
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Bijv. Belangrijke wijziging rooster volgende week"
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {/* Bericht */}
            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Bericht
              </label>

              <textarea
                id="message"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                rows={6}
                placeholder="Typ hier je mededeling..."
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {/* Verzenden */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !title.trim() ||
                  !message.trim()
                }
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Bezig met verzenden..."
                  : "Mededeling versturen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
