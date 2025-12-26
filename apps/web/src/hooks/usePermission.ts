import { useMemo } from "react";

import { useAuthStore } from "@/stores/authStore";

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const permissionSet = useMemo(() => {
    return new Set(user?.permissions ?? []);
  }, [user?.permissions]);

  const roleSet = useMemo(() => {
    return new Set((user?.roles ?? []).map((r) => r.name));
  }, [user?.roles]);

  const hasPermission = (code: string) => permissionSet.has(code);
  const hasAnyPermission = (codes: string[]) =>
    codes.some((c) => permissionSet.has(c));
  const hasRole = (name: string) => roleSet.has(name);

  return {
    isAuthenticated,
    user,
    permissions: user?.permissions ?? [],
    roles: user?.roles ?? [],
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
}
