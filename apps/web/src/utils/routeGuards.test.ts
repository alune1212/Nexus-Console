import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUserResponse } from "@/api/models";
import { useAuthStore } from "@/stores/authStore";

const mockCustomFetch = vi.fn();
vi.mock("@/api/client", () => ({
  customFetch: (args: unknown) => mockCustomFetch(args),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<object>("@tanstack/react-router");
  return {
    ...actual,
    redirect: (opts: unknown) => opts,
  };
});

import { requireAuth, requirePermission } from "@/utils/routeGuards";

describe("routeGuards", () => {
  beforeEach(() => {
    mockCustomFetch.mockReset();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("requireAuth sets store and returns me when authenticated", async () => {
    const me: CurrentUserResponse = {
      id: 1,
      email: "a@example.com",
      name: null,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      roles: [],
      permissions: ["users:read"],
    };
    mockCustomFetch.mockResolvedValueOnce(me);

    const result = await requireAuth("http://localhost/users");
    expect(result.email).toBe("a@example.com");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("a@example.com");
  });

  it("requireAuth throws redirect to /login when unauthenticated", async () => {
    mockCustomFetch.mockRejectedValueOnce(new Error("401"));
    await expect(requireAuth("http://localhost/users")).rejects.toMatchObject({
      to: "/login",
      search: { redirect: "http://localhost/users" },
    });
  });

  it("requirePermission throws redirect to /forbidden when missing permission", async () => {
    const me: CurrentUserResponse = {
      id: 1,
      email: "a@example.com",
      name: null,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      roles: [],
      permissions: [],
    };
    mockCustomFetch.mockResolvedValueOnce(me);

    await expect(
      requirePermission("rbac:read", "http://localhost/admin")
    ).rejects.toMatchObject({
      to: "/forbidden",
      search: { missing: "rbac:read", from: "http://localhost/admin" },
    });
  });
});
