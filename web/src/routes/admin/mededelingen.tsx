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
  const [target, setTarget] = useState<TargetAudience>("both");
  const [priority, setPriority] = useState<Priority>("normal");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  async function handleSubmitMededeling(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError("Vul een titel in voor de mededeling.");
      return;
    }

    if (!message.trim()) {
      setFormError("Vul de inhoud van de mededeling in.");
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

      setFormSuccess("Mededeling is succesvol verzonden!");
      setTitle("");
      setMessage("");
      setTarget("both");
      setPriority("normal");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Kon de mededeling niet versturen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      {/* Hoofdkaart gecentreerd */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        
        {/* Titel en subtekst gecentreerd binnen de kaart */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Mededelingenbeheer</h1>
          <p className="mt-1 text-sm text-slate-500">
            Verstuur algemene schoolmededelingen naar specifieke gebruikersrollen in het systeem.
          </p>
        </div>

        {formError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmitMededeling} className="space-y-6">
          {/* Doelgroep Selectie */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ontvangers</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTarget("students")}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  target === "students"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Alleen studenten
              </button>
              <button
                type="button"
                onClick={() => setTarget("teachers")}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  target === "teachers"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Alleen docenten
              </button>
              <button
                type="button"
                onClick={() => setTarget("both")}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  target === "both"
                    ? "border-purple-600 bg-purple-50 text-purple-700 font-semibold"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Studenten & Docenten
              </button>
            </div>
          </div>

          {/* Prioriteit / Status Selectie */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Prioriteit</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPriority("low")}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  priority === "low"
                    ? "border-slate-600 bg-slate-100 text-slate-800 font-semibold"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Laag
              </button>
              <button
                type="button"
                onClick={() => setPriority("normal")}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  priority === "normal"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Normaal
              </button>
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  priority === "high"
                    ? "border-amber-500 bg-amber-50 text-amber-700 font-semibold"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Hoog
              </button>
              <button
                type="button"
                onClick={() => setPriority("urgent")}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  priority === "urgent"
                    ? "border-red-600 bg-red-50 text-red-700 font-semibold"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Urgent
              </button>
            </div>
          </div>

          {/* Titel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Belangrijke wijziging rooster volgende week"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Bericht */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bericht</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Typ hier je mededeling..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? "Bezig met verzenden..." : "Mededeling versturen"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}