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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { handleError } = useErrorHandler();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    // 手动验证密码确认
    if (data.password !== data.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // 注册用户
      await customFetch<{
        id: number;
        email: string;
        name: string | null;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>({
        url: "http://localhost:8000/api/v1/auth/register",
        method: "POST",
        data: {
          email: data.email,
          password: data.password,
          name: data.name || null,
        },
      });

      // 注册成功后自动登录
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

      // 导航到首页
      navigate({ to: "/" });
    } catch (err: unknown) {
      const errorInfo = handleError(err, {
        showToast: false, // 在表单中显示错误，不使用 Toast
        defaultMessage: "注册失败，请检查您的输入信息",
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
          <CardTitle>注册</CardTitle>
          <CardDescription>创建您的 Nexus Console 账户</CardDescription>
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
                {...register("email", {
                  required: "请输入邮箱地址",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "请输入有效的邮箱地址",
                  },
                })}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                姓名（可选）
              </label>
              <Input
                id="name"
                type="text"
                placeholder="您的姓名"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
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
                {...register("password", {
                  required: "请输入密码",
                  minLength: {
                    value: 8,
                    message: "密码至少需要 8 个字符",
                  },
                  validate: (value) => {
                    if (!/[A-Z]/.test(value)) {
                      return "密码必须包含至少一个大写字母";
                    }
                    if (!/[a-z]/.test(value)) {
                      return "密码必须包含至少一个小写字母";
                    }
                    if (!/[0-9]/.test(value)) {
                      return "密码必须包含至少一个数字";
                    }
                    return true;
                  },
                })}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                密码需至少 8 个字符，包含大小写字母和数字
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword", {
                  required: "请确认密码",
                  validate: (value) => {
                    if (value !== password) {
                      return "两次输入的密码不一致";
                    }
                    return true;
                  },
                })}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "注册中..." : "注册"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              已有账户？{" "}
              <Link
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                立即登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
