import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/forbidden")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const search = useSearch({ from: "/forbidden" }) as {
    missing?: string;
    from?: string;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>无权限访问</CardTitle>
          <CardDescription>你没有访问此页面所需的权限</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {search.missing ? (
            <p className="text-sm text-muted-foreground">
              缺少权限：<span className="font-mono">{search.missing}</span>
            </p>
          ) : null}
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">返回首页</Button>
            </Link>
            {search.from ? (
              <a href={search.from}>
                <Button>返回上一页</Button>
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
