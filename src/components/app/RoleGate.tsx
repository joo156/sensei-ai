import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { homeForRole, useAuth, type Role } from "@/contexts/AuthContext";

export function RoleGate({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: window.location.pathname } });
      return;
    }
    if (!allow.includes(user.role)) {
      navigate({ to: homeForRole(user.role) });
    }
  }, [ready, user, allow, navigate]);

  if (!ready || !user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
