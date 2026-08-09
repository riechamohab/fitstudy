import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  type AdminUser,
} from "../../lib/api";

export const Route = createFileRoute("/admin/studentenlijst")({
  component: AdminStudentenPage,
});

type CreateFormState = {
  name: string;
  email: string;
  password: string;
  studentClass: string;
};

const emptyCreateForm: CreateFormState = {
  name: "",
  email: "",
  password: "",
  studentClass: "",
};

type EditFormState = {
  name: string;
  email: string;
  studentClass: string;
};

function AdminStudentenPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    email: "",
    studentClass: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon studenten niet ophalen.");
    } finally {
      setLoading(false);
    }
  }

  const students = users.filter((u) => u.role === "student");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError("Naam, e-mail en wachtwoord zijn verplicht.");
      return;
    }

    setCreating(true);
    try {
      await createAdminUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: "student",
        studentClass: createForm.studentClass.trim() || undefined,
      });

      setCreateForm(emptyCreateForm);
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Kon student niet aanmaken.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(student: AdminUser) {
    setEditingId(student.id);
    setEditError(null);
    setEditForm({
      name: student.name,
      email: student.email,
      studentClass: student.studentClass ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    setEditError(null);

    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("Naam en e-mail zijn verplicht.");
      return;
    }

    setSavingEdit(true);
    try {
      await updateAdminUser(id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: "student",
        studentClass: editForm.studentClass.trim() || undefined,
      });

      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Kon student niet bijwerken.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon student niet verwijderen.");
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Studenten</h1>
      <p className="mt-1 text-sm text-slate-500">
        Beheer studentprofielen: aanmaken, bekijken en klas wijzigen.
      </p>

      <form
        onSubmit={handleCreate}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Naam</label>
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Wachtwoord</label>
          <input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Klas</label>
          <input
            type="text"
            value={createForm.studentClass}
            onChange={(e) => setCreateForm((f) => ({ ...f, studentClass: e.target.value }))}
            placeholder="Bijv. B4"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {createError && (
          <p className="sm:col-span-2 text-sm text-red-600">{createError}</p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Bezig met aanmaken..." : "Student aanmaken"}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">
        Studentenlijst ({students.length})
      </h2>

      {loading && <p className="mt-4 text-sm text-slate-500">Studenten laden...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && students.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">Nog geen studenten</p>
          <p className="mt-2 text-sm text-slate-500">
            Maak hierboven een studentprofiel aan om te beginnen.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {editingId === student.id ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Naam"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="E-mail"
                />
                <input
                  type="text"
                  value={editForm.studentClass}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, studentClass: e.target.value }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Klas"
                />

                {editError && (
                  <p className="sm:col-span-3 text-sm text-red-600">{editError}</p>
                )}

                <div className="sm:col-span-3 flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(student.id)}
                    disabled={savingEdit}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingEdit ? "Opslaan..." : "Opslaan"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">
                    {student.email}
                    {student.studentClass ? ` · Klas ${student.studentClass}` : " · Geen klas"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(student)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

