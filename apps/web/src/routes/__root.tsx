import { customFetch } from "@/api/client";
import type { CurrentUserResponse } from "@/api/models";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useEffect } from "react";

function RootComponent() {
  const { isAuthenticated, user, login, logout } = useAuthStore();

  // 应用启动时尝试恢复登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await customFetch<CurrentUserResponse>({
          url: "http://localhost:8000/api/v1/auth/me",
          method: "GET",
        });
        login(response);
      } catch {
        // 未登录或认证失败，保持未登录状态
      }
    };

    checkAuth();
  }, [login]);

  const handleLogout = async () => {
    try {
      await customFetch({
        url: "http://localhost:8000/api/v1/auth/logout",
        method: "POST",
      });
      logout();
    } catch (error) {
      console.error("Logout error:", error);
      // 即使请求失败也清除本地状态
      logout();
    }
  };

  return (
    <>
      <div className="p-2 flex gap-2 items-center border-b">
        <Link to="/" className="[&.active]:font-bold">
          首页
        </Link>
        <Link to="/users" className="[&.active]:font-bold">
          用户
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          关于
        </Link>
        {isAuthenticated && user?.permissions?.includes("rbac:read") ? (
          <Link to="/admin/rbac" className="[&.active]:font-bold">
            权限
          </Link>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                登出
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
