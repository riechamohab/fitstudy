import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  createAdminUser,
  createSchedule,
  deleteAdminUser,
  getAdminUsers,
  getSchedules,
  type AdminUser,
  type Schedule
} from "../lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "users" | "schedule"
  >("users");

  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: "teacher" | "student" | "admin";
  }>({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

const [scheduleForm, setScheduleForm] = useState({
  title: "",
  role: "student",
  day: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  subject: "",
});

useEffect(() => {
  async function fetchData() {
    try {
      const usersData = await getAdminUsers();
      console.log("USERS:", usersData);
      setUsers(usersData);

      const schedulesData = await getSchedules();
      setSchedules(schedulesData);

    } catch (err) {
      console.error(err);
      setError("Data laden mislukt");
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, []);

  async function handleCreateUser(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      await createAdminUser(form);

      const updatedUsers = await getAdminUsers();
      setUsers(updatedUsers);

      setForm({
        name: "",
        email: "",
        password: "",
        role: "student",
      });
    } catch (error) {
      console.error(error);
      setError("Gebruiker aanmaken mislukt");
    }
  }

  async function handleDeleteUser(id: string) {
    const confirmed = window.confirm(
      "Weet je zeker dat je deze gebruiker wilt verwijderen?"
    );

    if (!confirmed) return;

    try {
      await deleteAdminUser(id);

      const updatedUsers = await getAdminUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error(error);
      setError("Gebruiker verwijderen mislukt");
    }
  }

  async function handleCreateSchedule(
  event: React.FormEvent
) {
  console.log("CREATE SCHEDULE CLICKED");

  event.preventDefault();

  try {
    console.log("SENDING:", scheduleForm);

    await createSchedule(scheduleForm);

    const updatedSchedules = await getSchedules();
    setSchedules(updatedSchedules);

    setScheduleForm({
      title: "",
      role: "student",
      day: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      subject: "",
    });

  } catch (error) {
    console.error(error);
    setError("Rooster toevoegen mislukt");
  }
}

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>

        <p className="mt-4">
          Gebruikers laden...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-3xl font-bold">
        Admin Dashboard
      </h1>

      <p className="mb-6">
        Welkom admin!
      </p>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setActiveTab("users")}
          className={`rounded px-4 py-2 ${
            activeTab === "users"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Gebruikers
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`rounded px-4 py-2 ${
            activeTab === "schedule"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Rooster
        </button>
      </div>

      {error && (
        <p className="mb-4 text-red-500">
          {error}
        </p>
      )}

      {activeTab === "users" && (
        <>
          <div className="mb-8 rounded-lg border p-4">
            <h2 className="mb-4 text-xl font-bold">
              Nieuwe gebruiker toevoegen
            </h2>

            <form
              onSubmit={handleCreateUser}
              className="space-y-3"
            >
              <input
                className="w-full rounded border p-2"
                placeholder="Naam"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              <input
                className="w-full rounded border p-2"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
                            <div className="relative">
                <input
                  className="w-full rounded border p-2 pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  aria-label="Toon of verberg wachtwoord"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <select
                className="w-full rounded border p-2"
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as
                      | "student"
                      | "teacher"
                      | "admin",
                  })
                }
              >
                <option value="student">
                  Student
                </option>

                <option value="teacher">
                  Teacher
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create User
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-3 text-left">
                    Naam
                  </th>

                  <th className="p-3 text-left">
                    Email
                  </th>

                  <th className="p-3 text-left">
                    Rol
                  </th>

                  <th className="p-3 text-left">
                    Aangemaakt
                  </th>

                  <th className="p-3 text-left">
                    Acties
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b"
                  >
                    <td className="p-3">
                      {user.name}
                    </td>

                    <td className="p-3">
                      {user.email}
                    </td>

                    <td className="p-3">
                      {user.role}
                    </td>

                    <td className="p-3">
                      {new Date(
                        user.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          handleDeleteUser(user.id)
                        }
                        className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="mt-4">
              Geen gebruikers gevonden.
            </p>
          )}
        </>
      )}
  {activeTab === "schedule" && (
  <div className="rounded-lg border p-6">

    <h2 className="mb-4 text-xl font-bold">
      Rooster toevoegen
    </h2>

    <form
      onSubmit={handleCreateSchedule}
      className="space-y-3"
    >

      <input
        className="w-full rounded border p-2"
        placeholder="Titel"
        value={scheduleForm.title}
        onChange={(e) =>
          setScheduleForm({
            ...scheduleForm,
            title: e.target.value,
          })
        }
      />

      <input
  className="w-full rounded border p-2"
  type="date"
  value={scheduleForm.date}
  onChange={(e) =>
    setScheduleForm({
      ...scheduleForm,
      date: e.target.value,
    })
  }
/>

<select
  className="w-full rounded border p-2"
  value={scheduleForm.role}
  onChange={(e) =>
    setScheduleForm({
      ...scheduleForm,
      role: e.target.value,
    })
  }
>
  <option value="student">
    Student
  </option>

  <option value="teacher">
    Teacher
  </option>
</select>

      <input
        className="w-full rounded border p-2"
        placeholder="Vak"
        value={scheduleForm.subject}
        onChange={(e) =>
          setScheduleForm({
            ...scheduleForm,
            subject: e.target.value,
          })
        }
      />

      <input
        className="w-full rounded border p-2"
        placeholder="Dag"
        value={scheduleForm.day}
        onChange={(e) =>
          setScheduleForm({
            ...scheduleForm,
            day: e.target.value,
          })
        }
      />

      <input
        className="w-full rounded border p-2"
        type="time"
        value={scheduleForm.startTime}
        onChange={(e) =>
          setScheduleForm({
            ...scheduleForm,
            startTime: e.target.value,
          })
        }
      />

      <input
        className="w-full rounded border p-2"
        type="time"
        value={scheduleForm.endTime}
        onChange={(e) =>
          setScheduleForm({
            ...scheduleForm,
            endTime: e.target.value,
          })
        }
      />

      <input
        className="w-full rounded border p-2"
        placeholder="Locatie"
        value={scheduleForm.location}
        onChange={(e) =>
          setScheduleForm({
            ...scheduleForm,
            location: e.target.value,
          })
        }
      />

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Rooster toevoegen
      </button>

    </form>


    <hr className="my-6" />


    <h2 className="mb-4 text-xl font-bold">
      Bestaand rooster
    </h2>


    {schedules.length === 0 ? (
  <p>
    Geen rooster gevonden.
  </p>
) : (
  schedules.map((item) => (
    <div
      key={item.id}
      className="mb-3 rounded border p-4"
    >
      <b>{item.subject}</b>

      <p>
        {item.day} {item.startTime} - {item.endTime}
      </p>

      <p>
        {item.location}
      </p>
    </div>
  ))
)}

      </div>
    )}
  </div>
);
}