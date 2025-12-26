import { useMemo, useState } from "react";

import {
  getListRolesApiV1RolesGetQueryKey,
  useCreateRoleApiV1RolesPost,
  useDeleteRoleApiV1RolesRoleIdDelete,
  useListPermissionsApiV1PermissionsGet,
  useListRolesApiV1RolesGet,
  useSetRolePermissionsApiV1RolesRoleIdPermissionsPut,
  useSetUserRolesApiV1UsersUserIdRolesPut,
  useUpdateRoleApiV1RolesRoleIdPatch,
} from "@/api/endpoints/rbac/rbac";
import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";
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
import { useQueryClient } from "@tanstack/react-query";
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
  const canReadUsers = hasPermission("users:read");
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  const rolesQuery = useListRolesApiV1RolesGet();
  const permissionsQuery = useListPermissionsApiV1PermissionsGet();
  const usersQuery = useListUsersApiV1UsersGet(
    { skip: 0, limit: 100 },
    { query: { enabled: canReadUsers } }
  );

  const createRole = useCreateRoleApiV1RolesPost();
  const deleteRole = useDeleteRoleApiV1RolesRoleIdDelete();
  const setRolePermissions =
    useSetRolePermissionsApiV1RolesRoleIdPermissionsPut();
  const setUserRoles = useSetUserRolesApiV1UsersUserIdRolesPut();
  const updateRole = useUpdateRoleApiV1RolesRoleIdPatch();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const selectedRole = useMemo(() => {
    return (rolesQuery.data ?? []).find((r) => r.id === selectedRoleId) ?? null;
  }, [rolesQuery.data, selectedRoleId]);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const selectedUser = useMemo(() => {
    return (usersQuery.data ?? []).find((u) => u.id === selectedUserId) ?? null;
  }, [usersQuery.data, selectedUserId]);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleExclusiveGroup, setNewRoleExclusiveGroup] = useState("");
  const [newRolePriority, setNewRolePriority] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allPermissions = permissionsQuery.data ?? [];

  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [userRoleNames, setUserRoleNames] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [editExclusiveGroup, setEditExclusiveGroup] = useState("");
  const [editPriority, setEditPriority] = useState("0");

  const onSelectRole = (roleId: number, codes: string[]) => {
    setSelectedRoleId(roleId);
    setPermissionCodes(codes);

    const role = (rolesQuery.data ?? []).find((r) => r.id === roleId);
    setEditExclusiveGroup(role?.exclusive_group ?? "");
    setEditPriority(String(role?.priority ?? 0));
  };

  const onSelectUser = (userId: number, roleNames: string[]) => {
    setSelectedUserId(userId);
    setUserRoleNames(roleNames);
  };

  const togglePermission = (code: string) => {
    setPermissionCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleUserRole = (roleName: string) => {
    const roleByName = new Map((rolesQuery.data ?? []).map((r) => [r.name, r]));
    const target = roleByName.get(roleName);
    const group = target?.exclusive_group ?? null;

    setUserRoleNames((prev) => {
      const already = prev.includes(roleName);

      // Toggle off is always allowed
      if (already) return prev.filter((n) => n !== roleName);

      // For mutually exclusive groups, remove other roles in the same group.
      if (group) {
        const filtered = prev.filter((n) => {
          const r = roleByName.get(n);
          return (r?.exclusive_group ?? null) !== group;
        });
        return [...filtered, roleName];
      }

      return [...prev, roleName];
    });
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
      const eg = newRoleExclusiveGroup.trim();
      const priorityNum = Number(newRolePriority);
      if (!Number.isFinite(priorityNum) || Number.isNaN(priorityNum)) {
        setError("优先级必须是数字");
        return;
      }
      const role = await createRole.mutateAsync({
        data: {
          name,
          description: newRoleDesc.trim() || null,
          exclusive_group: eg || null,
          priority: priorityNum,
        },
      });
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRoleExclusiveGroup("");
      setNewRolePriority("0");
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

  const onDeleteRole = async (roleId: number, roleName: string) => {
    if (
      !window.confirm(
        `确定要删除角色「${roleName}」吗？\n\n注意：如果该角色仍被用户使用，系统会要求你先解绑后再删除。`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteRole.mutateAsync({ roleId });

      // 立即从缓存中移除被删除角色，避免 UI 需要手动刷新。
      const rolesKey = getListRolesApiV1RolesGetQueryKey();
      queryClient.setQueryData(rolesKey, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((r) => (r as { id?: number }).id !== roleId);
      });

      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
        setPermissionCodes([]);
      }

      // 再触发一次失效刷新，确保服务端状态为准（不阻塞 UI；失败也不应影响“删除成功”提示）。
      void queryClient
        .invalidateQueries({ queryKey: rolesKey })
        .catch(() => undefined);
      setSuccess("角色已删除");
    } catch (err: unknown) {
      const info = handleError(err, {
        showToast: false,
        defaultMessage: "删除角色失败",
      });
      setError(info.message);
    }
  };

  const onSaveRoleMeta = async () => {
    if (!selectedRole) return;
    if (selectedRole.is_system) return;
    try {
      setError("");
      setSuccess("");
      const eg = editExclusiveGroup.trim();
      const priorityNum = Number(editPriority);
      if (!Number.isFinite(priorityNum) || Number.isNaN(priorityNum)) {
        setError("优先级必须是数字");
        return;
      }

      await updateRole.mutateAsync({
        roleId: selectedRole.id,
        data: {
          exclusive_group: eg || null,
          priority: priorityNum,
        },
      });
      await rolesQuery.refetch();
      setSuccess("角色属性已更新");
    } catch (err: unknown) {
      const info = handleError(err, {
        showToast: false,
        defaultMessage: "更新角色属性失败",
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

  const onSaveUserRoles = async () => {
    if (!selectedUser) return;
    try {
      setError("");
      setSuccess("");
      await setUserRoles.mutateAsync({
        userId: selectedUser.id,
        data: { role_names: userRoleNames },
      });
      await usersQuery.refetch();
      setSuccess("用户角色已更新");
    } catch (err: unknown) {
      const info = handleError(err, {
        showToast: false,
        defaultMessage: "更新用户角色失败",
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
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="互斥组（可选，例如 account）"
                  value={newRoleExclusiveGroup}
                  onChange={(e) => setNewRoleExclusiveGroup(e.target.value)}
                  disabled={!canWrite || createRole.isPending}
                />
                <Input
                  placeholder="优先级（数字，越大越优先）"
                  value={newRolePriority}
                  onChange={(e) => setNewRolePriority(e.target.value)}
                  disabled={!canWrite || createRole.isPending}
                />
              </div>
              {!canWrite ? (
                <p className="text-xs text-muted-foreground">
                  你只有只读权限（rbac:read），无法创建/修改
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              {(rolesQuery.data ?? []).map((r) => (
                <div
                  key={r.id}
                  className={`w-full rounded-md border p-3 ${
                    selectedRoleId === r.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="flex-1 text-left hover:underline"
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
                      {r.is_system ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          系统角色（不可删除）
                        </div>
                      ) : null}
                    </button>

                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!canWrite || r.is_system || deleteRole.isPending}
                      onClick={() => onDeleteRole(r.id, r.name)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
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
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="互斥组（为空表示可叠加）"
                      value={editExclusiveGroup}
                      onChange={(e) => setEditExclusiveGroup(e.target.value)}
                      disabled={
                        !canWrite || selectedRole.is_system || updateRole.isPending
                      }
                    />
                    <Input
                      placeholder="优先级（数字）"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      disabled={
                        !canWrite || selectedRole.is_system || updateRole.isPending
                      }
                    />
                  </div>
                  {selectedRole.is_system ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      系统角色（{selectedRole.name}）的互斥组/优先级为只读。
                    </p>
                  ) : null}
                  <Button
                    className="mt-2 w-full"
                    onClick={onSaveRoleMeta}
                    disabled={
                      !canWrite || selectedRole.is_system || updateRole.isPending
                    }
                    variant="outline"
                  >
                    {updateRole.isPending ? "保存中..." : "保存角色属性"}
                  </Button>
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

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">用户角色分配</h2>
          <p className="text-sm text-muted-foreground mt-1">
            选择用户并为其勾选角色（保存需要 rbac:write；加载用户列表需要
            users:read）
          </p>
        </div>

        {!canReadUsers ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            你没有 users:read 权限，无法在此页面加载用户列表。
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>选择一个用户进行角色分配</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="按邮箱/名称搜索"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  disabled={usersQuery.isPending}
                />

                <div className="space-y-2">
                  {(usersQuery.data ?? [])
                    .filter((u) => {
                      const q = userSearch.trim().toLowerCase();
                      if (!q) return true;
                      const email = u.email.toLowerCase();
                      const name = (u.name ?? "").toLowerCase();
                      return email.includes(q) || name.includes(q);
                    })
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className={`w-full text-left rounded-md border p-3 hover:bg-muted ${
                          selectedUserId === u.id ? "bg-muted" : ""
                        }`}
                        onClick={() =>
                          onSelectUser(
                            u.id,
                            (u.roles ?? []).map((r) => r.name)
                          )
                        }
                      >
                        <div className="font-medium">{u.name || "未命名"}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          角色：
                          {(u.roles ?? []).length > 0
                            ? (u.roles ?? []).map((r) => r.name).join(", ")
                            : "（无）"}
                        </div>
                      </button>
                    ))}
                  {usersQuery.isPending ? (
                    <p className="text-sm text-muted-foreground">
                      加载用户中...
                    </p>
                  ) : null}
                  {usersQuery.isError ? (
                    <p className="text-sm text-destructive">加载用户失败</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>角色分配</CardTitle>
                <CardDescription>为选中用户勾选角色</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedUser ? (
                  <p className="text-sm text-muted-foreground">
                    请先在左侧选择一个用户
                  </p>
                ) : (
                  <>
                    <div className="rounded-md border p-3">
                      <div className="font-medium">
                        {selectedUser.name || "未命名"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedUser.email}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(rolesQuery.data ?? []).map((r) => {
                        const checked = userRoleNames.includes(r.name);
                        return (
                          <label
                            key={r.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUserRole(r.name)}
                              disabled={!canWrite || setUserRoles.isPending}
                            />
                            <span>
                              <span className="font-mono">{r.name}</span>
                              {r.description ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  — {r.description}
                                </span>
                              ) : null}
                              {r.exclusive_group ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  （互斥组：{r.exclusive_group}）
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                      {rolesQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">
                          加载角色中...
                        </p>
                      ) : null}
                    </div>

                    {!canWrite ? (
                      <p className="text-xs text-muted-foreground">
                        你只有只读权限（rbac:read），无法修改用户角色
                      </p>
                    ) : null}

                    <Button
                      className="w-full"
                      onClick={onSaveUserRoles}
                      disabled={!canWrite || setUserRoles.isPending}
                    >
                      {setUserRoles.isPending ? "保存中..." : "保存用户角色"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
