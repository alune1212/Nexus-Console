import { useChangePasswordApiV1AuthChangePasswordPost } from "@/api/endpoints/auth/auth";
import {
  useGetCurrentUserProfileApiV1UsersMeGet,
  useUpdateCurrentUserProfileApiV1UsersMePatch,
} from "@/api/endpoints/users/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { requireAuth } from "@/utils/routeGuards";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

type ProfileUpdateFormData = {
  email: string;
  name: string;
};

type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function validatePasswordStrength(value: string): true | string {
  if (value.length < 8) return "密码至少需要 8 个字符";
  if (!/[A-Z]/.test(value)) return "密码必须包含至少一个大写字母";
  if (!/[a-z]/.test(value)) return "密码必须包含至少一个小写字母";
  if (!/[0-9]/.test(value)) return "密码必须包含至少一个数字";
  return true;
}

export const Route = createFileRoute("/profile")({
  beforeLoad: async ({ location }) => {
    await requireAuth(location.href);
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user, isLoading: isLoadingUser } =
    useGetCurrentUserProfileApiV1UsersMeGet();
  const updateProfile = useUpdateCurrentUserProfileApiV1UsersMePatch();
  const changePassword = useChangePasswordApiV1AuthChangePasswordPost();
  const patchAuthStoreUser = useAuthStore((state) => state.patchUser);

  // 资料更新表单
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileUpdateFormData>({
    values: user
      ? {
          email: user.email,
          name: user.name || "",
        }
      : undefined,
  });

  // 密码修改表单
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({});

  const [profileError, setProfileError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<string>("");

  const onProfileSubmit = async (data: ProfileUpdateFormData) => {
    try {
      setProfileError("");
      setProfileSuccess("");

      const updatedUser = await updateProfile.mutateAsync({
        data: {
          email: data.email,
          name: data.name || null,
        },
      });

      // 更新认证状态
      patchAuthStoreUser({
        email: updatedUser.email,
        name: updatedUser.name ?? null,
      });

      setProfileSuccess("资料更新成功");
      resetProfile({
        email: updatedUser.email,
        name: updatedUser.name || "",
      });
    } catch (err: unknown) {
      console.error("Profile update error:", err);
      if (err && typeof err === "object" && "detail" in err) {
        const detail = (err as { detail: string | string[] }).detail;
        setProfileError(
          typeof detail === "string" ? detail : "更新失败，请检查输入信息"
        );
      } else {
        setProfileError("更新失败，请检查您的输入信息");
      }
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    try {
      setPasswordError("");
      setPasswordSuccess("");
      if (data.newPassword !== data.confirmPassword) {
        setPasswordError("两次输入的密码不一致");
        return;
      }

      await changePassword.mutateAsync({
        data: {
          current_password: data.currentPassword,
          new_password: data.newPassword,
        },
      });

      setPasswordSuccess("密码修改成功，请重新登录");
      resetPassword();
      // 延迟跳转到登录页（让用户看到成功消息）
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: unknown) {
      console.error("Password change error:", err);
      if (err && typeof err === "object" && "detail" in err) {
        const detail = (err as { detail: string | string[] }).detail;
        setPasswordError(
          typeof detail === "string" ? detail : "密码修改失败，请检查输入信息"
        );
      } else {
        setPasswordError("密码修改失败，请检查您的输入信息");
      }
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">无法加载用户资料</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">用户资料</h1>
        <p className="text-muted-foreground mt-2">管理您的账户信息和密码</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 资料编辑卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>个人资料</CardTitle>
            <CardDescription>更新您的邮箱和姓名</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmitProfile(onProfileSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="profile-email" className="text-sm font-medium">
                  邮箱
                </label>
                <Input
                  id="profile-email"
                  type="email"
                  {...registerProfile("email", {
                    required: "请输入邮箱地址",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "请输入有效的邮箱地址",
                    },
                  })}
                  disabled={updateProfile.isPending}
                />
                {profileErrors.email && (
                  <p className="text-sm text-destructive">
                    {profileErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="profile-name" className="text-sm font-medium">
                  姓名
                </label>
                <Input
                  id="profile-name"
                  type="text"
                  {...registerProfile("name")}
                  disabled={updateProfile.isPending}
                />
                {profileErrors.name && (
                  <p className="text-sm text-destructive">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>

              {profileError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                  {profileSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "保存中..." : "保存更改"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 密码修改卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>更改您的登录密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmitPassword(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="current-password"
                  className="text-sm font-medium"
                >
                  当前密码
                </label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword("currentPassword", {
                    required: "请输入当前密码",
                  })}
                  disabled={changePassword.isPending}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  新密码
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword("newPassword", {
                    required: "请输入新密码",
                    validate: validatePasswordStrength,
                  })}
                  disabled={changePassword.isPending}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  密码需至少 8 个字符，包含大小写字母和数字
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  确认新密码
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword("confirmPassword", {
                    required: "请确认新密码",
                  })}
                  disabled={changePassword.isPending}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {passwordError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                  {passwordSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? "修改中..." : "修改密码"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
