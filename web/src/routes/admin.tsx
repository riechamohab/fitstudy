import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/admin/users",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Geen toegang");
        }

        const data = await response.json();

        setUsers(data);

      } catch (err) {
        setError("Je hebt geen toegang tot het admin dashboard");
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>

      <p className="mb-6">
        Welkom admin!
      </p>

      {error && (
        <p className="text-red-500">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded p-4"
          >
            <p>
              <strong>Naam:</strong> {user.name}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Rol:</strong> {user.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}