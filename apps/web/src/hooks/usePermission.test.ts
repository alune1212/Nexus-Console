import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/authStore";

describe("usePermission", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("returns permission and role helpers", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: "a@example.com",
        name: null,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        roles: [{ id: 1, name: "admin", description: null, permissions: [] }],
        permissions: ["rbac:read", "users:read"],
      },
    });

    const { result } = renderHook(() => usePermission());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("a@example.com");
    expect(result.current.hasRole("admin")).toBe(true);
    expect(result.current.hasPermission("rbac:read")).toBe(true);
    expect(result.current.hasPermission("rbac:write")).toBe(false);
    expect(result.current.hasAnyPermission(["rbac:write", "users:read"])).toBe(
      true
    );
  });
});
