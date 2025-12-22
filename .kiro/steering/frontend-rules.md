# 前端开发规则

> 本文档约束前端代码风格和最佳实践

## 核心原则

1. **类型安全**: TypeScript 必须 `strict: true`
2. **组件化**: 小而专注的组件
3. **性能优先**: 避免不必要的重渲染

## TanStack Router

```typescript
// ✅ 正确：TanStack Router 文件路由
// src/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  component: UserDetail,
  loader: async ({ params }) => {
    return fetchUser(params.userId);
  },
});

function UserDetail() {
  const user = Route.useLoaderData();
  return <div>{user.name}</div>;
}

// ❌ 错误：React Router
import { useParams } from "react-router-dom";
```

## TanStack Query v5

```typescript
// ✅ 正确：TanStack Query v5 语法
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 查询
const { data, isPending, isError } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
});

// 变更
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});

// ❌ 错误：Redux
import { useSelector, useDispatch } from "react-redux";
const user = useSelector((state) => state.user);
```

## Zustand 状态管理

```typescript
// ✅ 正确：Zustand + TypeScript
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// 使用 useShallow 优化选择器
import { useShallow } from "zustand/react/shallow";

function UserInfo() {
  const { user, isAuthenticated } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }))
  );
}

// ❌ 错误：Redux
import { createSlice } from "@reduxjs/toolkit";
```

## React Hook Form + Zod

```typescript
// ✅ 正确：React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // 处理提交
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" {...register("password")} />
      <button type="submit">登录</button>
    </form>
  );
}

// ❌ 错误：Formik + Yup
import { Formik } from "formik";
import * as Yup from "yup";
```

## Tailwind CSS

```tsx
// ✅ 正确：Tailwind CSS 工具类
function Button({ children, variant = "primary" }) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]}`}>{children}</button>
  );
}

// ❌ 错误：CSS-in-JS
import styled from "styled-components";
const Button = styled.button`
  background: blue;
`;
```

## 数据获取模式

```typescript
// ✅ 正确：使用 fetch + TanStack Query
const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

const { data: users } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});

// ❌ 错误：使用 axios
import axios from "axios";
const { data } = await axios.get("/api/users");
```

## TypeScript 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Tailwind 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```
