import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { changePassword } from "../lib/api";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      alert("Vul je huidige wachtwoord in");
      return;
    }

    if (!passwordValid) {
      alert("Je wachtwoord voldoet nog niet aan alle eisen");
      return;
    }

    if (password !== confirmPassword) {
      alert("Wachtwoorden komen niet overeen");
      return;
    }

    try {
      await changePassword(currentPassword, password);

      console.log("Password succesvol gewijzigd");

      await navigate({
        to: "/student-dashboard",
      });

    } catch (error) {
      console.error("Change password error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Wachtwoord wijzigen mislukt"
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold">
          Nieuw wachtwoord instellen
        </h1>

        {/* Huidig wachtwoord */}
        <div className="relative mb-4">
          <input
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Huidig wachtwoord"
            className="w-full rounded border p-3 pr-12"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() =>
              setShowCurrentPassword(!showCurrentPassword)
            }
            className="absolute right-3 top-3"
          >
            {showCurrentPassword ? "🙈" : "👁️"}
          </button>
        </div>


        {/* Nieuw wachtwoord */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nieuw wachtwoord"
            className="w-full rounded border p-3 pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>


        {/* Wachtwoord regels */}
        <div className="mb-4 text-sm">
          <p className="mb-2 font-semibold">
            Wachtwoord moet bevatten:
          </p>

          <p className={passwordRules.length ? "text-green-600" : "text-gray-500"}>
            {passwordRules.length ? "✓" : "○"} Minimaal 8 tekens
          </p>

          <p className={passwordRules.uppercase ? "text-green-600" : "text-gray-500"}>
            {passwordRules.uppercase ? "✓" : "○"} Minimaal 1 hoofdletter
          </p>

          <p className={passwordRules.lowercase ? "text-green-600" : "text-gray-500"}>
            {passwordRules.lowercase ? "✓" : "○"} Minimaal 1 kleine letter
          </p>

          <p className={passwordRules.number ? "text-green-600" : "text-gray-500"}>
            {passwordRules.number ? "✓" : "○"} Minimaal 1 cijfer
          </p>

          <p className={passwordRules.special ? "text-green-600" : "text-gray-500"}>
            {passwordRules.special ? "✓" : "○"} Minimaal 1 speciaal teken
          </p>
        </div>


        {/* Bevestig wachtwoord */}
        <div className="relative mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Herhaal nieuw wachtwoord"
            className="w-full rounded border p-3 pr-12"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-3 top-3"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>


        {/* Opslaan knop */}
        <button
          type="submit"
          disabled={!passwordValid || password !== confirmPassword}
          className={`w-full rounded p-3 text-white ${
            passwordValid && password === confirmPassword
              ? "bg-blue-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Opslaan
        </button>

      </form>
    </main>
  );
}