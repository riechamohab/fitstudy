import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FocusTimerIcon } from "../../components/ui/icons";
import {
  createAssignment,
  getTeacherClasses,
  getTeacherTasks,
  type TeacherTask,
} from "../../lib/api";

export const Route = createFileRoute("/docent/opdrachten")({
  component: TeacherAssignmentsPage,
});

function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherTask[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [className, setClassName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const [assignmentsData, classesData] = await Promise.all([
        getTeacherTasks(),
        getTeacherClasses(),
      ]);

      setAssignments(assignmentsData);
      setAvailableClasses(classesData.classes);

      if (classesData.classes.length > 0) {
        setClassName(classesData.classes[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon gegevens niet ophalen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!className) {
      setError("Kies een klas.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createAssignment({
        className,
        title,
        description: description || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        priority,
      });

      setSuccessMessage(
        `Opdracht succesvol uitgezet voor ${result.studentsAssigned} studenten in klas ${className}!`
      );

      setTitle("");
      setDescription("");
      setDeadline("");

      const assignmentsData = await getTeacherTasks();
      setAssignments(assignmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon opdracht niet versturen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-blue-600">
          <FocusTimerIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Opdrachten & Voortgang</h1>
          <p className="text-gray-500 text-sm">
            Zet opdrachten uit per klas op basis van je rooster en volg live de voortgang.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Nieuwe opdracht opgeven</h2>
        <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klas (uit je rooster)</label>
            {availableClasses.length > 0 ? (
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                required
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled
                value="Geen klassen gevonden in je rooster"
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            >
              <option value="LOW">Laag</option>
              <option value="MEDIUM">Gemiddeld</option>
              <option value="HIGH">Hoog</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel van de opdracht</label>
            <input
              type="text"
              required
              placeholder="Bijv. Maken opgave 4 t/m 8"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving / Instructies (optioneel)</label>
            <textarea
              rows={3}
              placeholder="Eventuele toelichting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || availableClasses.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {submitting ? "Bezig met verzenden..." : "Opdracht publiceren voor klas"}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistieken & Voortgang per Opdracht</h2>
      {loading ? (
        <p className="text-gray-500 animate-pulse">Opdrachten laden...</p>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          <p>Je hebt nog geen opdrachten uitgezet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((item) => {
            const percentage = item.totalCount > 0
              ? Math.round((item.submittedCount / item.totalCount) * 100)
              : 0;

            return (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      Klas: {item.className}
                    </span>
                    {item.deadline && (
                      <span className="text-xs text-gray-500">
                        Deadline: {new Date(item.deadline).toLocaleDateString("nl-NL")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-base">{item.title}</h3>
                </div>

                <div className="w-full md:w-72 space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 font-medium">
                    <span>Voortgang (zelf gerapporteerd)</span>
                    <span>{item.submittedCount} / {item.totalCount} gedaan ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
