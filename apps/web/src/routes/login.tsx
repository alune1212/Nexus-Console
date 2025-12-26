import { customFetch } from "@/api/client";
import type { CurrentUserResponse } from "@/api/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少需要 8 个字符"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const redirect = (search as { redirect?: string }).redirect || "/";
  const login = useAuthStore((state) => state.login);
  const { handleError } = useErrorHandler();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError("");

      await customFetch({
        url: "http://localhost:8000/api/v1/auth/login",
        method: "POST",
        data: {
          email: data.email,
          password: data.password,
        },
      });

      // 登录成功后拉取包含 roles/permissions 的当前用户信息
      const me = await customFetch<CurrentUserResponse>({
        url: "http://localhost:8000/api/v1/auth/me",
        method: "GET",
      });
      login(me);

      // 导航到目标页面
      navigate({ to: redirect });
    } catch (err: unknown) {
      const errorInfo = handleError(err, {
        showToast: false, // 在表单中显示错误，不使用 Toast
        defaultMessage: "登录失败，请检查您的邮箱和密码",
      });
      setError(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>登录到 Nexus Console</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              还没有账户？{" "}
              <Link
                to="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                立即注册
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
