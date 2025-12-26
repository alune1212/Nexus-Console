import { useMemo, useState } from "react";

import {
  useCreateRoleApiV1RolesPost,
  useListPermissionsApiV1PermissionsGet,
  useListRolesApiV1RolesGet,
  useSetRolePermissionsApiV1RolesRoleIdPermissionsPut,
} from "@/api/endpoints/rbac/rbac";
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
import { usePermission } from "@/hooks/usePermission";
import { requirePermission } from "@/utils/routeGuards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/rbac")({
  beforeLoad: async ({ location }) => {
    await requirePermission("rbac:read", location.href);
  },
  component: AdminRbacPage,
});

function AdminRbacPage() {
  const { hasPermission } = usePermission();
  const canWrite = hasPermission("rbac:write");
  const { handleError } = useErrorHandler();

  const rolesQuery = useListRolesApiV1RolesGet();
  const permissionsQuery = useListPermissionsApiV1PermissionsGet();

  const createRole = useCreateRoleApiV1RolesPost();
  const setRolePermissions =
    useSetRolePermissionsApiV1RolesRoleIdPermissionsPut();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const selectedRole = useMemo(() => {
    return (rolesQuery.data ?? []).find((r) => r.id === selectedRoleId) ?? null;
  }, [rolesQuery.data, selectedRoleId]);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allPermissions = permissionsQuery.data ?? [];

  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);

  const onSelectRole = (roleId: number, codes: string[]) => {
    setSelectedRoleId(roleId);
    setPermissionCodes(codes);
  };

  const togglePermission = (code: string) => {
    setPermissionCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const onCreateRole = async () => {
    try {
      setError("");
      setSuccess("");
      const name = newRoleName.trim();
      if (!name) {
        setError("请输入角色名称");
        return;
      }
      const role = await createRole.mutateAsync({
        data: {
          name,
          description: newRoleDesc.trim() || null,
        },
      });
      setNewRoleName("");
      setNewRoleDesc("");
      onSelectRole(role.id, []);
      rolesQuery.refetch();
      setSuccess("角色创建成功");
    } catch (err: unknown) {
      const info = handleError(err, {
        showToast: false,
        defaultMessage: "创建角色失败",
      });
      setError(info.message);
    }
  };

  const onSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setError("");
      setSuccess("");
      await setRolePermissions.mutateAsync({
        roleId: selectedRole.id,
        data: { permission_codes: permissionCodes },
      });
      await rolesQuery.refetch();
      setSuccess("权限已更新");
    } catch (err: unknown) {
      const info = handleError(err, {
        showToast: false,
        defaultMessage: "更新权限失败",
      });
      setError(info.message);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">RBAC 管理</h1>
        <p className="text-muted-foreground mt-2">管理角色与权限分配</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>角色列表</CardTitle>
            <CardDescription>选择角色并配置权限</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">创建新角色</div>
              <div className="flex gap-2">
                <Input
                  placeholder="角色名称（如 viewer）"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  disabled={!canWrite || createRole.isPending}
                />
                <Button
                  onClick={onCreateRole}
                  disabled={!canWrite || createRole.isPending}
                >
                  {createRole.isPending ? "创建中..." : "创建"}
                </Button>
              </div>
              <Input
                placeholder="描述（可选）"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                disabled={!canWrite || createRole.isPending}
              />
              {!canWrite ? (
                <p className="text-xs text-muted-foreground">
                  你只有只读权限（rbac:read），无法创建/修改
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              {(rolesQuery.data ?? []).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`w-full text-left rounded-md border p-3 hover:bg-muted ${
                    selectedRoleId === r.id ? "bg-muted" : ""
                  }`}
                  onClick={() =>
                    onSelectRole(
                      r.id,
                      (r.permissions ?? []).map((p) => p.code)
                    )
                  }
                >
                  <div className="font-medium">{r.name}</div>
                  {r.description ? (
                    <div className="text-xs text-muted-foreground">
                      {r.description}
                    </div>
                  ) : null}
                </button>
              ))}
              {rolesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">加载角色中...</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>权限配置</CardTitle>
            <CardDescription>为选中角色勾选权限点</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground">
                请先在左侧选择一个角色
              </p>
            ) : (
              <>
                <div className="rounded-md border p-3">
                  <div className="font-medium">{selectedRole.name}</div>
                  {selectedRole.description ? (
                    <div className="text-xs text-muted-foreground">
                      {selectedRole.description}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {allPermissions.map((p) => {
                    const checked = permissionCodes.includes(p.code);
                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(p.code)}
                          disabled={!canWrite || setRolePermissions.isPending}
                        />
                        <span>
                          <span className="font-mono">{p.code}</span>
                          {p.description ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {p.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                  {permissionsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      加载权限中...
                    </p>
                  ) : null}
                </div>

                <Button
                  className="w-full"
                  onClick={onSavePermissions}
                  disabled={!canWrite || setRolePermissions.isPending}
                >
                  {setRolePermissions.isPending ? "保存中..." : "保存权限"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
