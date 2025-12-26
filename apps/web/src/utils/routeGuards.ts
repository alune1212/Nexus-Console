import { customFetch } from "@/api/client";
import type { CurrentUserResponse } from "@/api/models";
import { useAuthStore } from "@/stores/authStore";
import { redirect } from "@tanstack/react-router";

async function fetchMe(): Promise<CurrentUserResponse> {
  return await customFetch<CurrentUserResponse>({
    url: "http://localhost:8000/api/v1/auth/me",
    method: "GET",
  });
}

export async function requireAuth(
  locationHref: string
): Promise<CurrentUserResponse> {
  try {
    const me = await fetchMe();
    useAuthStore.getState().login(me);
    return me;
  } catch {
    throw redirect({
      to: "/login",
      search: {
        redirect: locationHref,
      },
    });
  }
}

export async function requirePermission(
  permission: string,
  locationHref: string
): Promise<CurrentUserResponse> {
  const me = await requireAuth(locationHref);
  if (!me.permissions.includes(permission)) {
    throw redirect({
      to: "/forbidden",
      search: {
        missing: permission,
        from: locationHref,
      },
    });
  }
  return me;
}
