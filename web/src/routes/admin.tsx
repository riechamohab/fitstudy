import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminUsers, type AdminUser } from "../lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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