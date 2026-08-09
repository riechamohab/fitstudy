import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  type AdminUser,
} from "../../lib/api";

export const Route = createFileRoute("/admin/docentenlijst")({
  component: AdminDocentenPage,
});

type CreateFormState = {
  name: string;
  email: string;
  password: string;
  subjects: string;
  isMentor: boolean;
  mentorClassName: string;
  mentorSchoolYear: string;
};

const emptyCreateForm: CreateFormState = {
  name: "",
  email: "",
  password: "",
  subjects: "",
  isMentor: false,
  mentorClassName: "",
  mentorSchoolYear: "",
};

type EditFormState = {
  name: string;
  email: string;
  subjects: string;
  isMentor: boolean;
  mentorClassName: string;
  mentorSchoolYear: string;
};

function subjectsToArray(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function subjectsToString(subjects: string[] | null): string {
  return subjects ? subjects.join(", ") : "";
}

function AdminDocentenPage() {
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
    subjects: "",
    isMentor: false,
    mentorClassName: "",
    mentorSchoolYear: "",
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
      setError(err instanceof Error ? err.message : "Kon docenten niet ophalen.");
    } finally {
      setLoading(false);
    }
  }

  const teachers = users.filter((u) => u.role === "teacher");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError("Naam, e-mail en wachtwoord zijn verplicht.");
      return;
    }

    if (createForm.isMentor && (!createForm.mentorClassName.trim() || !createForm.mentorSchoolYear.trim())) {
      setCreateError("Vul klas en schooljaar in als deze docent mentor is.");
      return;
    }

    setCreating(true);
    try {
      await createAdminUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: "teacher",
        subjects: subjectsToArray(createForm.subjects),
        mentorClassName: createForm.isMentor ? createForm.mentorClassName.trim() : undefined,
        mentorSchoolYear: createForm.isMentor ? createForm.mentorSchoolYear.trim() : undefined,
      });

      setCreateForm(emptyCreateForm);
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Kon docent niet aanmaken.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(teacher: AdminUser) {
    setEditingId(teacher.id);
    setEditError(null);
    setEditForm({
      name: teacher.name,
      email: teacher.email,
      subjects: subjectsToString(teacher.subjects),
      isMentor: Boolean(teacher.mentorClassName && teacher.mentorSchoolYear),
      mentorClassName: teacher.mentorClassName ?? "",
      mentorSchoolYear: teacher.mentorSchoolYear ?? "",
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

    if (editForm.isMentor && (!editForm.mentorClassName.trim() || !editForm.mentorSchoolYear.trim())) {
      setEditError("Vul klas en schooljaar in als deze docent mentor is.");
      return;
    }

    setSavingEdit(true);
    try {
      await updateAdminUser(id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: "teacher",
        subjects: subjectsToArray(editForm.subjects),
        mentorClassName: editForm.isMentor ? editForm.mentorClassName.trim() : undefined,
        mentorSchoolYear: editForm.isMentor ? editForm.mentorSchoolYear.trim() : undefined,
      });

      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Kon docent niet bijwerken.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon docent niet verwijderen.");
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Docenten</h1>
      <p className="mt-1 text-sm text-slate-500">
        Beheer docentprofielen: vakken, mentorschap en accountgegevens.
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
          <label className="block text-sm font-medium text-slate-700">
            Vakken <span className="font-normal text-slate-400">(komma-gescheiden)</span>
          </label>
          <input
            type="text"
            value={createForm.subjects}
            onChange={(e) => setCreateForm((f) => ({ ...f, subjects: e.target.value }))}
            placeholder="Bijv. Natuurkunde, Wiskunde"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="create-is-mentor"
            checked={createForm.isMentor}
            onChange={(e) => setCreateForm((f) => ({ ...f, isMentor: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="create-is-mentor" className="text-sm font-medium text-slate-700">
            Deze docent is mentor van een klas
          </label>
        </div>

        {createForm.isMentor && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mentorklas</label>
              <input
                type="text"
                value={createForm.mentorClassName}
                onChange={(e) => setCreateForm((f) => ({ ...f, mentorClassName: e.target.value }))}
                placeholder="Bijv. B4"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Schooljaar</label>
              <input
                type="text"
                value={createForm.mentorSchoolYear}
                onChange={(e) => setCreateForm((f) => ({ ...f, mentorSchoolYear: e.target.value }))}
                placeholder="Bijv. 2025-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {createError && (
          <p className="sm:col-span-2 text-sm text-red-600">{createError}</p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Bezig met aanmaken..." : "Docent aanmaken"}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">
        Docentenlijst ({teachers.length})
      </h2>

      {loading && <p className="mt-4 text-sm text-slate-500">Docenten laden...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && teachers.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">Nog geen docenten</p>
          <p className="mt-2 text-sm text-slate-500">
            Maak hierboven een docentprofiel aan om te beginnen.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {editingId === teacher.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
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
                  value={editForm.subjects}
                  onChange={(e) => setEditForm((f) => ({ ...f, subjects: e.target.value }))}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Vakken (komma-gescheiden)"
                />

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-is-mentor-${teacher.id}`}
                    checked={editForm.isMentor}
                    onChange={(e) => setEditForm((f) => ({ ...f, isMentor: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor={`edit-is-mentor-${teacher.id}`} className="text-sm font-medium text-slate-700">
                    Mentor van een klas
                  </label>
                </div>

                {editForm.isMentor && (
                  <>
                    <input
                      type="text"
                      value={editForm.mentorClassName}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, mentorClassName: e.target.value }))
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Mentorklas"
                    />
                    <input
                      type="text"
                      value={editForm.mentorSchoolYear}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, mentorSchoolYear: e.target.value }))
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Schooljaar"
                    />
                  </>
                )}

                {editError && (
                  <p className="sm:col-span-2 text-sm text-red-600">{editError}</p>
                )}

                <div className="sm:col-span-2 flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(teacher.id)}
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
                  <p className="font-semibold text-slate-900">{teacher.name}</p>
                  <p className="text-sm text-slate-500">{teacher.email}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {teacher.subjects && teacher.subjects.length > 0
                      ? teacher.subjects.join(", ")
                      : "Geen vakken opgegeven"}
                  </p>
                  {teacher.mentorClassName && teacher.mentorSchoolYear && (
                    <p className="mt-1 text-sm font-medium text-emerald-700">
                      Mentor van {teacher.mentorClassName} ({teacher.mentorSchoolYear})
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(teacher)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
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

