import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProgressIcon } from "../../components/ui/icons";

export const Route = createFileRoute("/docent/feedback")({
  component: TeacherFeedbackPage,
});

function TeacherFeedbackPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<"STUDENT" | "CLASS">("STUDENT");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Haal studenten en klassen op voor de dropdowns
    fetch("/api/teacher/students", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  // Unieke klassen uit de studentenlijst
  const classes = Array.from(new Set(students.map((s) => s.className).filter(Boolean)));

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      const endpoint = selectedType === "STUDENT" ? "/api/teacher/notes" : "/api/teacher/announce";
      const body = selectedType === "STUDENT" 
        ? { studentId: recipient, message } 
        : { className: recipient, title: "Mededeling", message, type: "GENERAL" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Verzenden mislukt");
      
      setSuccess(selectedType === "STUDENT" ? "Persoonlijke notitie verstuurd." : "Mededeling verstuurd naar de klas.");
      setMessage("");
    } catch (err) {
      alert("Er is iets misgegaan bij het versturen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-green-600"><ProgressIcon /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Feedback & Mededelingen</h1>
          <p className="text-gray-500 text-sm">Stuur persoonlijke voortgangsfeedback of algemene klasberichten.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border">{success}</div>}
        
        <form onSubmit={handleSend}>
          {/* Type Selectie */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => { setSelectedType("STUDENT"); setRecipient(""); }}
              className={`flex-1 py-2 rounded-lg font-medium ${selectedType === "STUDENT" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Persoonlijke Notitie
            </button>
            <button
              type="button"
              onClick={() => { setSelectedType("CLASS"); setRecipient(""); }}
              className={`flex-1 py-2 rounded-lg font-medium ${selectedType === "CLASS" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Klas Mededeling
            </button>
          </div>

          {/* Ontvanger Selectie */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedType === "STUDENT" ? "Selecteer Student" : "Selecteer Klas"}
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">-- Kies een optie --</option>
              {selectedType === "STUDENT" 
                ? students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)
                : classes.map((c) => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>

          {/* Bericht */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bericht</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-32"
              placeholder={selectedType === "STUDENT" ? "Feedback over voortgang of welzijn..." : "Bijv: De les van morgen vervalt..."}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !recipient || !message}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Versturen..." : "Bericht Versturen"}
          </button>
        </form>
      </div>
    </div>
  );
}