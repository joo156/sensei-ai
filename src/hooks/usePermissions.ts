/** Permission hook — the only sanctioned way for UI to gate on a role. */
import { useAuth } from "@/contexts/AuthContext";
import type { Permission } from "@/constants";

export function usePermissions() {
  const { user, can, hasRole } = useAuth();
  return {
    role: user?.role,
    can,
    hasRole,
    canAll: (permissions: Permission[]) => permissions.every(can),
    canAny: (permissions: Permission[]) => permissions.some(can),
  };
}
