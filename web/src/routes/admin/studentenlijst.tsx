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

type ManageFormState = {
  name: string;
  email: string;
  phone: string;
  studentNumber: string;
  school: string;
  study: string;
  schoolYear: string;
  studentClass: string;
  studyHistory: string;
};

function AdminStudentenPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] =
    useState<CreateFormState>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ==============================
  // BEHEREN MODAL
  // ==============================

  const [managingStudent, setManagingStudent] =
    useState<AdminUser | null>(null);

  const [manageForm, setManageForm] = useState<ManageFormState>({
    name: "",
    email: "",
    phone: "",
    studentNumber: "",
    school: "",
    study: "",
    schoolYear: "",
    studentClass: "",
    studyHistory: "",
  });

  const [manageError, setManageError] = useState<string | null>(null);
  const [savingManage, setSavingManage] = useState(false);

  // ==============================
  // KLASFILTER
  // ==============================

  const [selectedClass, setSelectedClass] = useState("all");

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
          : "Kon studenten niet ophalen."
      );
    } finally {
      setLoading(false);
    }
  }

  const students = users.filter((user) => user.role === "student");

  // Maak een lijst met alle unieke klassen
  const classes = Array.from(
    new Set(
      students
        .map((student) => student.studentClass?.trim())
        .filter(
          (studentClass): studentClass is string =>
            Boolean(studentClass)
        )
    )
  ).sort();

  // Filter studenten op basis van geselecteerde klas
  const filteredStudents =
    selectedClass === "all"
      ? students
      : students.filter(
          (student) =>
            student.studentClass?.trim() === selectedClass
        );

  // ==============================
  // STUDENT AANMAKEN
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

    setCreating(true);

    try {
      await createAdminUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: "student",
        studentClass:
          createForm.studentClass.trim() || undefined,
      });

      setCreateForm(emptyCreateForm);
      await loadUsers();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Kon student niet aanmaken."
      );
    } finally {
      setCreating(false);
    }
  }

  // ==============================
  // BEHEREN OPENEN
  // ==============================

  function startManage(student: AdminUser) {
    setManagingStudent(student);
    setManageError(null);

    setManageForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phoneNumber || "",
      studentNumber: student.studentId || "",
      school: student.school || "",
      study: student.study || "",
      schoolYear: student.schoolYear || "2025-2026",
      studentClass: student.studentClass || "",
      studyHistory: student.studyHistory || "",
    });
  }

  // ==============================
  // BEHEREN SLUITEN
  // ==============================

  function closeManage() {
    setManagingStudent(null);
    setManageError(null);
  }

  // ==============================
  // STUDENT OPSLAAN
  // ==============================

  async function handleSaveManage(e: React.FormEvent) {
    e.preventDefault();

    if (!managingStudent) return;

    setManageError(null);

    if (
      !manageForm.name.trim() ||
      !manageForm.email.trim()
    ) {
      setManageError("Naam en e-mail zijn verplicht.");
      return;
    }

    const trimmedStudentNumber =
      manageForm.studentNumber.trim();

    // Controleer of het studentnummer al bestaat
    // bij een andere student.
    if (trimmedStudentNumber) {
      const isDuplicate = students.some(
        (student) =>
          student.id !== managingStudent.id &&
          student.studentId?.toLowerCase() ===
            trimmedStudentNumber.toLowerCase()
      );

      if (isDuplicate) {
        setManageError(
          "Dit studentnummer is al in gebruik door een andere student."
        );
        return;
      }
    }

    setSavingManage(true);

    try {
      await updateAdminUser(managingStudent.id, {
        name: manageForm.name.trim(),
        email: manageForm.email.trim(),
        role: "student",

        studentId:
          trimmedStudentNumber || undefined,

        phoneNumber:
          manageForm.phone.trim() || undefined,

        school:
          manageForm.school.trim() || undefined,

        study:
          manageForm.study.trim() || undefined,

        schoolYear:
          manageForm.schoolYear.trim() || undefined,

        studentClass:
          manageForm.studentClass.trim() || undefined,

        studyHistory:
          manageForm.studyHistory.trim() || undefined,
      });

      // Modal sluiten
      setManagingStudent(null);

      // Nieuwe gegevens ophalen
      await loadUsers();
    } catch (err) {
      setManageError(
        err instanceof Error
          ? err.message
          : "Kon student niet bijwerken."
      );
    } finally {
      setSavingManage(false);
    }
  }

  // ==============================
  // STUDENT VERWIJDEREN
  // ==============================

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Weet je zeker dat je deze student wilt verwijderen?"
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
          : "Kon student niet verwijderen."
      );
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Studenten
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Beheer studentprofielen: aanmaken, bekijken en
        gegevens wijzigen of verwijderen.
      </p>

      {/* ==========================================
          NIEUWE STUDENT AANMAKEN
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
            Klas
          </label>

          <input
            type="text"
            value={createForm.studentClass}
            onChange={(e) =>
              setCreateForm((form) => ({
                ...form,
                studentClass: e.target.value,
              }))
            }
            placeholder="Bijv. B4"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

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
              : "Student aanmaken"}
          </button>
        </div>
      </form>

      {/* ==========================================
          STUDENTENLIJST + KLASFILTER
          ========================================== */}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Studentenlijst ({filteredStudents.length})
        </h2>

        <div className="flex items-center gap-3">
          <label
            htmlFor="class-filter"
            className="text-sm font-medium text-slate-700"
          >
            Filter op klas:
          </label>

          <select
            id="class-filter"
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              Alle klassen
            </option>

            {classes.map((studentClass) => (
              <option
                key={studentClass}
                value={studentClass}
              >
                {studentClass}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Studenten laden...
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        students.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Nog geen studenten
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Maak hierboven een studentprofiel aan om
              te beginnen.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        students.length > 0 &&
        filteredStudents.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Geen studenten gevonden
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Er zijn geen studenten in klas{" "}
              {selectedClass}.
            </p>
          </div>
        )}

      {/* ==========================================
          OVERZICHT STUDENTEN
          ========================================== */}

      <div className="mt-4 grid gap-3">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {student.name}
              </p>

              <p className="text-sm text-slate-500">
                {student.email}
                {student.studentClass
                  ? ` · Klas ${student.studentClass}`
                  : " · Geen klas"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startManage(student)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Beheren
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(student.id)
                }
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ==========================================
          BEHEREN MODAL
          ========================================== */}

      {managingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Student Beheren
                </h3>

                <p className="text-xs text-slate-500">
                  ID: {managingStudent.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeManage}
                className="text-xl font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveManage}
              className="space-y-6"
            >
              {/* ==================================
                  PERSOONLIJKE GEGEVENS
                  ================================== */}

              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
                  Persoonlijke gegevens
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Naam
                    </label>

                    <input
                      type="text"
                      value={manageForm.name}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      School e-mailadres
                    </label>

                    <input
                      type="email"
                      value={manageForm.email}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Telefoonnummer
                    </label>

                    <input
                      type="text"
                      value={manageForm.phone}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Bijv. +597..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Studentnummer
                    </label>

                    <input
                      type="text"
                      value={manageForm.studentNumber}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          studentNumber: e.target.value,
                        })
                      }
                      placeholder="Bijv. STU12345"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* ==================================
                  STUDIEGEGEVENS
                  ================================== */}

              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
                  Studiegegevens
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      School
                    </label>

                    <input
                      type="text"
                      value={manageForm.school}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          school: e.target.value,
                        })
                      }
                      placeholder="Bijv. UNASAT"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Opleiding
                    </label>

                    <input
                      type="text"
                      value={manageForm.study}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          study: e.target.value,
                        })
                      }
                      placeholder="Bijv. Software Engineering"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Huidig schooljaar
                    </label>

                    <input
                      type="text"
                      value={manageForm.schoolYear}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          schoolYear: e.target.value,
                        })
                      }
                      placeholder="2025-2026"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Klas
                    </label>

                    <input
                      type="text"
                      value={manageForm.studentClass}
                      onChange={(e) =>
                        setManageForm({
                          ...manageForm,
                          studentClass: e.target.value,
                        })
                      }
                      placeholder="Bijv. B4"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* ==================================
                  STUDIEGESCHIEDENIS
                  ================================== */}

              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
                  Studiegeschiedenis
                </h4>

                <textarea
                  value={manageForm.studyHistory}
                  onChange={(e) =>
                    setManageForm({
                      ...manageForm,
                      studyHistory: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Voer eventuele eerdere opleidingen of studiegeschiedenis in..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              {manageError && (
                <p className="text-sm text-red-600">
                  {manageError}
                </p>
              )}

              {/* ==================================
                  MODAL KNOPPEN
                  ================================== */}

              <div className="flex gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeManage}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Sluiten
                </button>

                <button
                  type="submit"
                  disabled={savingManage}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingManage
                    ? "Opslaan..."
                    : "Gegevens opslaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}