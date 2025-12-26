import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePermission } from "@/utils/routeGuards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users")({
  beforeLoad: async ({ location }) => {
    await requirePermission("users:read", location.href);
  },
  component: Users,
});

function Users() {
  const {
    data: users,
    isPending,
    isError,
  } = useListUsersApiV1UsersGet({
    skip: 0,
    limit: 10,
  });

  return (
    <div className="p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>使用 Orval 生成的类型安全 API Hooks</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && <p className="text-muted-foreground">加载中...</p>}
          {isError && <p className="text-destructive">加载失败</p>}
          {users && users.length === 0 && (
            <p className="text-muted-foreground">暂无用户</p>
          )}
          {users && users.length > 0 && (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name || "未命名"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    查看详情
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
