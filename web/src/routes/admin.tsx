import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  type AdminUser,
} from "../lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAdminUsers();

        setUsers(data);

      } catch (err) {
        console.error(err);
        setError("Je hebt geen toegang tot het admin dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
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

      <h1 className="text-3xl font-bold mb-2">
        Admin Dashboard
      </h1>

      <p className="mb-6">
        Welkom admin!
      </p>

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
    onClick={() => setShowPassword((prev) => !prev)}
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


      {error && (
        <p className="text-red-500 mb-4">
          {error}
        </p>
      )}


      <div className="border rounded-lg overflow-hidden">

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
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

<td className="p-3">
  <button
    onClick={() => handleDeleteUser(user.id)}
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

    </div>
  );
}