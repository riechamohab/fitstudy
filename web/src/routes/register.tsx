import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { signUp } from "../lib/api";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function EyeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
      <path d="M7.1 7.1C4.2 8.8 2.25 12 2.25 12S6 18.75 12 18.75c1.7 0 3.2-.5 4.5-1.2" />
      <path d="M14.1 5.5A8.5 8.5 0 0 0 12 5.25C6 5.25 2.25 12 2.25 12s1 1.8 2.8 3.4" />
      <path d="M17.7 8.1C20.1 9.8 21.75 12 21.75 12s-.8 1.5-2.3 3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(name, studentId, email, password);
      await navigate({ to: "/dashboard" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen overflow-hidden bg-slate-50 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <div className="mb-6 flex gap-8 border-b border-slate-200">
            <Link
              to="/login"
              className="pb-3 text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              Log in
            </Link>

            <button className="border-b-2 border-blue-600 pb-3 text-sm font-semibold text-blue-600">
              Sign up
            </button>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start your personal study space to plan smarter, track focus, and
            build better study habits.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Full name
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="What should we call you?"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Student ID
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                type="text"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="Your student ID"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Email address
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Create password
              </label>

              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Confirm password
              </label>

              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </section>

      <section className="hidden bg-blue-700 px-10 py-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <img src="/favicon.ico" alt="FitStudy logo" className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">FitStudy</span>
        </div>

        <div className="mx-auto max-w-xl text-center">
          <div className="mb-5 flex justify-center">
            <img src="/favicon.ico" alt="FitStudy" className="h-16 w-16" />
          </div>

          <h2 className="text-4xl font-bold leading-tight">
            Plan smarter,
            <br />
            study calmer.
          </h2>

          <p className="mt-5 text-base leading-7 text-blue-100">
            Your personal space to organize tasks, manage deadlines, monitor
            wellbeing, and track your learning journey.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-6 py-4 font-semibold">
              <CalendarIcon />
              Smart weekly planning
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-6 py-4 font-semibold">
              <FocusIcon />
              Focus & stress tracking
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-6 py-4 font-semibold">
              <ProgressIcon />
              Progress insights
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-blue-200">
          Built to help students stay organized, focused, and balanced.
        </p>
      </section>
    </main>
  );
}
