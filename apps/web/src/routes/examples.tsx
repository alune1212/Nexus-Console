import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

export const Route = createFileRoute("/examples")({
  component: ExamplesPage,
});

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Card className="border-red-500">
      <CardHeader>
        <CardTitle className="text-red-600">出错了！</CardTitle>
        <CardDescription>应用遇到了一个错误</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-600">{error.message}</p>
        <Button onClick={resetErrorBoundary} variant="outline">
          重试
        </Button>
      </CardContent>
    </Card>
  );
}

function BuggyComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("这是一个测试错误！");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>错误边界测试</CardTitle>
        <CardDescription>
          点击按钮触发错误，查看错误边界如何捕获
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShouldThrow(true)} variant="destructive">
          触发错误
        </Button>
      </CardContent>
    </Card>
  );
}

function ToasterExamples() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Toaster 通知示例</CardTitle>
        <CardDescription>展示不同类型的通知消息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast.success("操作成功！")} variant="default">
            成功通知
          </Button>
          <Button
            onClick={() => toast.error("操作失败！")}
            variant="destructive"
          >
            错误通知
          </Button>
          <Button
            onClick={() => toast.info("这是一条信息")}
            variant="secondary"
          >
            信息通知
          </Button>
          <Button onClick={() => toast.warning("请注意！")} variant="outline">
            警告通知
          </Button>
          <Button
            onClick={() =>
              toast.promise(
                new Promise((resolve) => setTimeout(resolve, 2000)),
                {
                  loading: "加载中...",
                  success: "加载完成！",
                  error: "加载失败",
                }
              )
            }
          >
            Promise 通知
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FormExample() {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error("请输入内容");
      return;
    }
    toast.success(`提交成功：${value}`);
    setValue("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>表单示例</CardTitle>
        <CardDescription>带验证的简单表单</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="输入一些内容..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button type="submit">提交</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ExamplesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">组件示例</h1>
        <p className="text-muted-foreground">
          展示 Toaster、错误边界和其他常用组件的使用方法
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ToasterExamples />
        <FormExample />
      </div>

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        <BuggyComponent />
      </ErrorBoundary>

      <Card>
        <CardHeader>
          <CardTitle>React Query DevTools</CardTitle>
          <CardDescription>
            开发环境下，右下角会显示 React Query DevTools 按钮
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            点击右下角的 React Query 图标可以查看查询状态、缓存数据等信息。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
