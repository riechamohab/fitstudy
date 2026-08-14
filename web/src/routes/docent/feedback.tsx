import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ProgressIcon } from "../../components/ui/icons";
import {
  getTeacherStudents,
  sendClassNote,
  sendStudentNote,
  type StudentProgress,
} from "../../lib/api";

export const Route = createFileRoute("/docent/feedback")({
  component: TeacherFeedbackPage,
});

function TeacherFeedbackPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [selectedType, setSelectedType] = useState<"STUDENT" | "CLASS">("STUDENT");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setIsLoadingStudents(true);
        setError("");

        const data = await getTeacherStudents();
        setStudents(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Kon studenten niet laden."
        );
      } finally {
        setIsLoadingStudents(false);
      }
    }

    loadStudents();
  }, []);

  const classes = Array.from(
    new Set(students.map((student) => student.className).filter(Boolean))
  ) as string[];

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();

    if (!recipient || !message.trim()) {
      setError("Selecteer een ontvanger en vul een bericht in.");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError("");

    try {
      if (selectedType === "STUDENT") {
        await sendStudentNote(recipient, message.trim());
        setSuccess("Persoonlijke notitie is verstuurd naar de student.");
      } else {
        await sendClassNote(recipient, message.trim());
        setSuccess("Klasmededeling is verstuurd naar de geselecteerde klas.");
      }

      setRecipient("");
      setMessage("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het versturen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-blue-600">
          <ProgressIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Feedback & Mededelingen
          </h1>
          <p className="text-gray-500 text-sm">
            Stuur persoonlijke voortgangsfeedback of algemene klasberichten.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        {success && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setSelectedType("STUDENT");
                setRecipient("");
                setSuccess(null);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg font-medium ${
                selectedType === "STUDENT"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Persoonlijke Notitie
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedType("CLASS");
                setRecipient("");
                setSuccess(null);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg font-medium ${
                selectedType === "CLASS"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Klas Mededeling
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedType === "STUDENT" ? "Selecteer Student" : "Selecteer Klas"}
            </label>

            <select
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={isLoadingStudents}
            >
              <option value="">
                {isLoadingStudents ? "Laden..." : "-- Kies een optie --"}
              </option>

              {selectedType === "STUDENT"
                ? students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                      {student.className ? ` (${student.className})` : ""}
                    </option>
                  ))
                : classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bericht
            </label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-32"
              placeholder={
                selectedType === "STUDENT"
                  ? "Feedback over voortgang of welzijn..."
                  : "Bijv: De les van morgen vervalt..."
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !recipient || !message.trim()}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Versturen..." : "Bericht Versturen"}
          </button>
        </form>
      </div>
    </div>
  );
}