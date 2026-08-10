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
  phoneNumber: string;
  subjects: string;
  isMentor: boolean;
  mentorClassName: string;
  mentorSchoolYear: string;
};

const emptyCreateForm: CreateFormState = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
  subjects: "",
  isMentor: false,
  mentorClassName: "",
  mentorSchoolYear: "",
};

type EditFormState = {
  name: string;
  email: string;
  phoneNumber: string;
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

  const [createForm, setCreateForm] =
    useState<CreateFormState>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ==============================
  // BEHEREN
  // ==============================

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    email: "",
    phoneNumber: "",
    subjects: "",
    isMentor: false,
    mentorClassName: "",
    mentorSchoolYear: "",
  });

  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // ==============================
  // VAK FILTER
  // ==============================

  const [selectedSubject, setSelectedSubject] = useState("all");

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
      setError(
        err instanceof Error
          ? err.message
          : "Kon docenten niet ophalen."
      );
    } finally {
      setLoading(false);
    }
  }

  const teachers = users.filter((user) => user.role === "teacher");

  // ==============================
  // ALLE BESCHIKBARE VAKKEN
  // ==============================

  const subjects = Array.from(
    new Set(
      teachers.flatMap((teacher) =>
        teacher.subjects ?? []
      )
    )
  )
    .map((subject) => subject.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // ==============================
  // GEFILTERDE DOCENTEN
  // ==============================

  const filteredTeachers =
    selectedSubject === "all"
      ? teachers
      : teachers.filter((teacher) =>
          teacher.subjects?.some(
            (subject) =>
              subject.trim().toLowerCase() ===
              selectedSubject.toLowerCase()
          )
        );

  // ==============================
  // DOCENT AANMAKEN
  // ==============================

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (
      !createForm.name.trim() ||
      !createForm.email.trim() ||
      !createForm.password.trim()
    ) {
      setCreateError(
        "Naam, e-mail en wachtwoord zijn verplicht."
      );
      return;
    }

    if (
      createForm.isMentor &&
      (!createForm.mentorClassName.trim() ||
        !createForm.mentorSchoolYear.trim())
    ) {
      setCreateError(
        "Vul klas en schooljaar in als deze docent mentor is."
      );
      return;
    }

    setCreating(true);

    try {
      await createAdminUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phoneNumber:
          createForm.phoneNumber.trim() || undefined,
        role: "teacher",
        subjects: subjectsToArray(createForm.subjects),
        mentorClassName: createForm.isMentor
          ? createForm.mentorClassName.trim()
          : undefined,
        mentorSchoolYear: createForm.isMentor
          ? createForm.mentorSchoolYear.trim()
          : undefined,
      });

      setCreateForm(emptyCreateForm);
      await loadUsers();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Kon docent niet aanmaken."
      );
    } finally {
      setCreating(false);
    }
  }

  // ==============================
  // BEHEREN OPENEN
  // ==============================

  function startEdit(teacher: AdminUser) {
    setEditingId(teacher.id);
    setEditError(null);

    setEditForm({
      name: teacher.name ?? "",
      email: teacher.email ?? "",
      phoneNumber: teacher.phoneNumber ?? "",
      subjects: subjectsToString(teacher.subjects),
      isMentor: Boolean(
        teacher.mentorClassName &&
          teacher.mentorSchoolYear
      ),
      mentorClassName:
        teacher.mentorClassName ?? "",
      mentorSchoolYear:
        teacher.mentorSchoolYear ?? "",
    });
  }

  // ==============================
  // BEHEREN ANNULEREN
  // ==============================

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  // ==============================
  // DOCENT OPSLAAN
  // ==============================

  async function handleSaveEdit(id: string) {
    setEditError(null);

    if (
      !editForm.name.trim() ||
      !editForm.email.trim()
    ) {
      setEditError(
        "Naam en e-mail zijn verplicht."
      );
      return;
    }

    if (
      editForm.isMentor &&
      (!editForm.mentorClassName.trim() ||
        !editForm.mentorSchoolYear.trim())
    ) {
      setEditError(
        "Vul klas en schooljaar in als deze docent mentor is."
      );
      return;
    }

    setSavingEdit(true);

    try {
      await updateAdminUser(id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),

        // Telefoonnummer wordt opgeslagen
        phoneNumber:
          editForm.phoneNumber.trim() || undefined,

        role: "teacher",

        // Vakken worden opgeslagen als array
        subjects: subjectsToArray(
          editForm.subjects
        ),

        mentorClassName: editForm.isMentor
          ? editForm.mentorClassName.trim()
          : undefined,

        mentorSchoolYear: editForm.isMentor
          ? editForm.mentorSchoolYear.trim()
          : undefined,
      });

      setEditingId(null);

      // Heel belangrijk:
      // opnieuw ophalen zodat het opgeslagen
      // telefoonnummer en de vakken direct uit
      // de database komen.
      await loadUsers();
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Kon docent niet bijwerken."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // ==============================
  // DOCENT VERWIJDEREN
  // ==============================

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Weet je zeker dat je deze docent wilt verwijderen?"
      )
    ) {
      return;
    }

    try {
      await deleteAdminUser(id);

      setUsers((prev) =>
        prev.filter((user) => user.id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kon docent niet verwijderen."
      );
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Docenten
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Beheer docentprofielen: vakken,
        telefoonnummer, mentorschap en
        accountgegevens.
      </p>

      {/* ==========================================
          DOCENT AANMAKEN
          ========================================== */}

      <form
        onSubmit={handleCreate}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Naam
          </label>

          <input
            type="text"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                name: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            E-mail
          </label>

          <input
            type="email"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                email: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Wachtwoord
          </label>

          <input
            type="password"
            value={createForm.password}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                password: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Telefoonnummer
          </label>

          <input
            type="text"
            value={createForm.phoneNumber}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                phoneNumber: e.target.value,
              }))
            }
            placeholder="Bijv. +597 8123456"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Vakken{" "}
            <span className="font-normal text-slate-400">
              (komma-gescheiden)
            </span>
          </label>

          <input
            type="text"
            value={createForm.subjects}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                subjects: e.target.value,
              }))
            }
            placeholder="Bijv. Natuurkunde, Wiskunde"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="create-is-mentor"
            checked={createForm.isMentor}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                isMentor: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />

          <label
            htmlFor="create-is-mentor"
            className="text-sm font-medium text-slate-700"
          >
            Deze docent is mentor van een klas
          </label>
        </div>

        {createForm.isMentor && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Mentorklas
              </label>

              <input
                type="text"
                value={createForm.mentorClassName}
                onChange={(e) =>
                  setCreateForm((form) => ({
                    ...form,
                    mentorClassName:
                      e.target.value,
                  }))
                }
                placeholder="Bijv. B4"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Schooljaar
              </label>

              <input
                type="text"
                value={createForm.mentorSchoolYear}
                onChange={(e) =>
                  setCreateForm((form) => ({
                    ...form,
                    mentorSchoolYear:
                      e.target.value,
                  }))
                }
                placeholder="Bijv. 2025-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {createError && (
          <p className="sm:col-span-2 text-sm text-red-600">
            {createError}
          </p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating
              ? "Bezig met aanmaken..."
              : "Docent aanmaken"}
          </button>
        </div>
      </form>

      {/* ==========================================
          DOCENTENLIJST + VAKFILTER
          ========================================== */}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Docentenlijst ({filteredTeachers.length})
        </h2>

        <div className="flex items-center gap-3">
          <label
            htmlFor="subject-filter"
            className="text-sm font-medium text-slate-700"
          >
            Filter op vak:
          </label>

          <select
            id="subject-filter"
            value={selectedSubject}
            onChange={(e) =>
              setSelectedSubject(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              Alle vakken
            </option>

            {subjects.map((subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Docenten laden...
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        teachers.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Nog geen docenten
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Maak hierboven een docentprofiel aan
              om te beginnen.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        teachers.length > 0 &&
        filteredTeachers.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Geen docenten gevonden
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Er zijn geen docenten voor vak{" "}
              <strong>{selectedSubject}</strong>.
            </p>
          </div>
        )}

      {/* ==========================================
          DOCENTEN
          ========================================== */}

      <div className="mt-4 grid gap-3">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {editingId === teacher.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {/* NAAM */}
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((form) => ({
                      ...form,
                      name: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Naam"
                />

                {/* EMAIL */}
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((form) => ({
                      ...form,
                      email: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="E-mail"
                />

                {/* TELEFOONNUMMER */}
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm((form) => ({
                      ...form,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Telefoonnummer"
                />

                {/* VAKKEN */}
                <input
                  type="text"
                  value={editForm.subjects}
                  onChange={(e) =>
                    setEditForm((form) => ({
                      ...form,
                      subjects: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Vakken (komma-gescheiden)"
                />

                {/* MENTOR */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-is-mentor-${teacher.id}`}
                    checked={editForm.isMentor}
                    onChange={(e) =>
                      setEditForm((form) => ({
                        ...form,
                        isMentor: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <label
                    htmlFor={`edit-is-mentor-${teacher.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Mentor van een klas
                  </label>
                </div>

                {editForm.isMentor && (
                  <>
                    <input
                      type="text"
                      value={editForm.mentorClassName}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          mentorClassName:
                            e.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Mentorklas"
                    />

                    <input
                      type="text"
                      value={editForm.mentorSchoolYear}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          mentorSchoolYear:
                            e.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Schooljaar"
                    />
                  </>
                )}

                {editError && (
                  <p className="sm:col-span-2 text-sm text-red-600">
                    {editError}
                  </p>
                )}

                <div className="sm:col-span-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveEdit(teacher.id)
                    }
                    disabled={savingEdit}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingEdit
                      ? "Opslaan..."
                      : "Opslaan"}
                  </button>

                  <button
                    type="button"
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
                  <p className="font-semibold text-slate-900">
                    {teacher.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {teacher.email}
                  </p>

                  {teacher.phoneNumber && (
                    <p className="text-sm text-slate-500">
                      Tel: {teacher.phoneNumber}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-slate-500">
                    {teacher.subjects &&
                    teacher.subjects.length > 0
                      ? teacher.subjects.join(", ")
                      : "Geen vakken opgegeven"}
                  </p>

                  {teacher.mentorClassName &&
                    teacher.mentorSchoolYear && (
                      <p className="mt-1 text-sm font-medium text-emerald-700">
                        Mentor van{" "}
                        {teacher.mentorClassName}{" "}
                        ({teacher.mentorSchoolYear})
                      </p>
                    )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(teacher)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Beheren
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(teacher.id)
                    }
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
