import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { signOut } from "../../lib/api";
import { teacherNavSections } from "../../lib/navigation/teacherNav";
import { AppShell } from "../../components/ui/AppShell";

export const Route = createFileRoute("/docent")({
  component: TeacherAppLayout,
});

function TeacherAppLayout() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
      await navigate({ to: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <AppShell
      navSections={teacherNavSections}
      onLogout={handleLogout}
      isSigningOut={isSigningOut}
    />
  );
}