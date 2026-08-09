import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { signOut } from "../../lib/api";
import { adminNavSections} from "../../lib/navigation/adminNav";
import { AppShell } from "../../components/ui/AppShell";

export const Route = createFileRoute("/admin")({
  component: adminAppLayout,
});

function adminAppLayout() {
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
      navSections={adminNavSections}
      onLogout={handleLogout}
      isSigningOut={isSigningOut}
    />
  );
}