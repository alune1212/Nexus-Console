# WARP.md

这个文件为 WARP (warp.dev) 提供在此代码库中工作时的指导。

## 项目概览

Nexus Console 是一个采用 Monorepo 架构的现代化全栈应用，使用 Turborepo 管理。核心技术栈：
- 后端：Python 3.13+ / FastAPI / SQLAlchemy 2.0 异步模式 / PostgreSQL / Redis
- 前端：React 19 / TypeScript 5 / TanStack Query v5 / TanStack Router / Tailwind CSS 4
- 构建：Turborepo / pnpm 10.26+ / uv (Python 包管理器)

## 常用命令

### 开发环境设置
```bash
# 自动化脚本（推荐，首次运行）
./scripts/dev-setup.sh

# 手动设置
pnpm install                                    # 安装前端依赖
cd apps/api && uv sync --extra dev              # 安装后端依赖
docker compose -f docker-compose.dev.yml up -d  # 启动数据库
pnpm --filter api db:migrate                    # 运行数据库迁移
pnpm types:sync                                 # 同步前后端类型
```

### 开发服务器
```bash
# 从项目根目录
pnpm dev                    # 同时启动所有服务（Turborepo 并行）

# 单独启动
pnpm --filter api dev       # 后端: http://localhost:8000
pnpm --filter web dev       # 前端: http://localhost:5173
```

### 构建
```bash
pnpm build                  # 构建所有应用
pnpm --filter web build     # 仅构建前端
```

### 代码质量检查
```bash
# 根目录命令（所有应用）
pnpm lint                   # 检查所有应用
pnpm test                   # 运行所有测试

# 后端
pnpm --filter api lint      # Ruff 检查
pnpm --filter api format    # Ruff 格式化
pnpm --filter api type-check # MyPy 类型检查
pnpm --filter api test      # pytest 单元测试
pnpm --filter api test:cov  # 测试覆盖率报告

# 前端
pnpm --filter web lint      # ESLint 检查
pnpm --filter web test      # Vitest 单元测试
pnpm --filter web test:ui   # 测试 UI 模式
pnpm --filter web test:coverage      # 测试覆盖率
pnpm --filter web test:e2e           # Playwright E2E 测试
pnpm --filter web test:e2e:ui        # E2E 测试 UI 模式
```

### 数据库迁移
```bash
# 注意：所有迁移命令需在 apps/api 目录下执行
pnpm --filter api migration:generate     # 自动生成迁移文件
pnpm --filter api migration:upgrade      # 应用迁移（alembic upgrade head）
pnpm --filter api migration:downgrade    # 回滚一个版本
```

### 前后端类型同步（重要）
```bash
pnpm types:sync             # 一键同步：导出 OpenAPI + 生成 TS 类型

# 分步执行
pnpm --filter api openapi:export    # 导出 OpenAPI 规范
pnpm --filter web api:generate      # 从 OpenAPI 生成 TypeScript 客户端
```

**何时需要同步类型：**
- 修改后端 Pydantic 模型后
- 添加/修改 FastAPI 路由后
- 拉取包含后端 API 变更的代码后

### 版本管理
```bash
pnpm release          # 自动判断版本类型（使用 standard-version）
pnpm release:patch    # 1.1.1 → 1.1.2
pnpm release:minor    # 1.1.1 → 1.2.0
pnpm release:major    # 1.1.1 → 2.0.0
```

## 架构关键点

### Monorepo 结构
```
apps/
├── api/                # FastAPI 后端
│   ├── app/
│   │   ├── main.py     # FastAPI 应用入口
│   │   ├── config.py   # 环境变量配置（Pydantic Settings）
│   │   ├── database.py # 数据库异步会话管理
│   │   ├── models/     # SQLAlchemy 2.0 模型（使用 Mapped 类型）
│   │   ├── schemas/    # Pydantic v2 模型（API 契约）
│   │   ├── api/v1/     # API 路由（版本化）
│   │   ├── core/       # 核心功能（缓存、错误处理、日志）
│   │   └── tests/      # pytest 测试
│   ├── alembic/        # 数据库迁移文件
│   └── pyproject.toml  # uv 项目配置
└── web/                # React 前端
    ├── src/
    │   ├── routes/     # TanStack Router 文件路由
    │   ├── api/        # Orval 生成的 API 客户端（不提交到 Git）
    │   ├── components/ui/ # shadcn/ui 组件
    │   ├── stores/     # Zustand 状态管理
    │   └── lib/        # 工具函数
    └── package.json
```

### 后端架构要点

**必须使用异步模式：**
- 数据库：`AsyncSession`, `async/await`, `create_async_engine`
- SQLAlchemy 2.0 语法：`Mapped[T]`, `mapped_column()`, `relationship()`
- HTTP 客户端：`httpx.AsyncClient`（禁止 `requests`）

**类型安全：**
- 所有函数必须有类型注解
- SQLAlchemy 模型使用 `Mapped` 类型
- Pydantic v2 语法：`model_config = ConfigDict()`（不是 `class Config`）

**数据库会话管理：**
```python
# 依赖注入模式
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one()
```

### 前端架构要点

**路由：TanStack Router 文件路由**
```typescript
// src/routes/users/$userId.tsx
export const Route = createFileRoute("/users/$userId")({
  component: UserDetail,
  loader: async ({ params }) => fetchUser(params.userId),
});
```

**数据获取：TanStack Query v5**
```typescript
// 使用 Orval 生成的 Hooks（推荐）
import { useListUsersApiV1UsersGet } from "@/api/endpoints/users/users";
const { data: users, isPending } = useListUsersApiV1UsersGet();

// 自定义查询
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
});
```

**状态管理：Zustand**
- 用于全局状态（认证、用户偏好等）
- 使用 `useShallow` 优化选择器性能

**表单：React Hook Form + Zod**
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type FormData = z.infer<typeof schema>;

const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

**样式：Tailwind CSS 4**
- 优先使用 Tailwind 工具类
- 避免 CSS-in-JS（styled-components）

### 前后端类型同步机制

**工作流程：**
1. 后端定义 Pydantic 模型（单一数据源）
2. FastAPI 自动生成 OpenAPI 规范
3. Orval 读取 OpenAPI 生成 TypeScript 类型和 TanStack Query Hooks
4. 前端获得完整类型安全

**禁止做法：**
- ❌ 手动编写 API 调用代码（`fetch`, `axios`）
- ❌ 手动定义 TypeScript 接口（应使用生成的类型）
- ❌ 修改 `apps/web/src/api/` 下的生成文件

**生成的文件（不提交到 Git）：**
- `apps/api/openapi/openapi.json`
- `apps/web/src/api/endpoints/`
- `apps/web/src/api/models/`

## 代码风格约定

### 后端（Python）
- 文件名：`snake_case.py`
- 类名：`PascalCase`
- 函数/变量：`snake_case`
- 常量：`UPPER_SNAKE_CASE`
- Linter：Ruff（100 字符行宽）
- 类型检查：MyPy strict 模式

### 前端（TypeScript）
- 组件文件：`PascalCase.tsx`
- 工具/hooks：`camelCase.ts`
- 组件名：`PascalCase`
- 函数/变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- TypeScript：`strict: true` + `noUncheckedIndexedAccess: true`

### Git 提交规范
必须遵循 Conventional Commits（由 commitlint 强制执行）：
```
feat(scope): 新功能
fix(scope): 修复问题
docs(scope): 文档更新
refactor(scope): 重构代码
test(scope): 测试相关
chore(scope): 杂项任务
```

示例：
```
feat(api): 添加用户认证端点
fix(web): 修复登录表单验证
docs: 更新 README 安装说明
```

## 开发流程要点

### 修改后端 API
1. 修改 `apps/api/app/schemas/` 下的 Pydantic 模型
2. 修改/添加 `apps/api/app/api/v1/` 下的路由
3. 运行 `pnpm types:sync` 同步类型
4. 前端自动获得新的类型和 Hooks

### 数据库 Schema 变更
1. 修改 `apps/api/app/models/` 下的 SQLAlchemy 模型
2. 运行 `pnpm --filter api migration:generate` 生成迁移文件
3. 检查生成的迁移文件（`apps/api/alembic/versions/`）
4. 运行 `pnpm --filter api migration:upgrade` 应用迁移

### 添加前端路由
1. 在 `apps/web/src/routes/` 下创建文件（TanStack Router 文件路由）
2. 文件名决定路由路径：`users/$userId.tsx` → `/users/:userId`
3. 使用 `createFileRoute` 定义路由配置

### 运行测试
```bash
# 提交代码前
pnpm lint                   # 所有应用的代码检查
pnpm test                   # 所有应用的测试
pnpm types:sync             # 确保类型同步
```

## 重要注意事项

1. **Python 包管理**：使用 `uv` 而非 `pip`
   - 添加依赖：编辑 `pyproject.toml` 后运行 `uv sync`
   - 安装开发依赖：`uv sync --extra dev`

2. **Node 包管理**：使用 `pnpm` 而非 `npm` 或 `yarn`
   - 添加依赖：`pnpm add <package>`
   - 为特定应用添加：`pnpm --filter web add <package>`

3. **环境变量**：
   - 后端：`apps/api/.env`（从 `.env.example` 复制）
   - 前端：`apps/web/.env`（如有需要）
   - 生产环境必须设置安全的 `SECRET_KEY`（32+ 字符）

4. **数据库**：
   - 开发环境使用 Docker Compose：`docker-compose.dev.yml`
   - 连接池配置在 `apps/api/app/database.py`

5. **API 文档**：
   - 开发时访问：http://localhost:8000/docs（Swagger UI）
   - ReDoc：http://localhost:8000/redoc

6. **禁止模式**：
   - ❌ 后端使用同步 SQLAlchemy 或 `requests`
   - ❌ 前端使用 Redux、React Router、axios
   - ❌ 手动编写 API 类型或调用代码

## 参考文档

项目内文档：
- `.kiro/steering/backend-rules.md` - 后端开发规则
- `.kiro/steering/frontend-rules.md` - 前端开发规则
- `.kiro/steering/structure.md` - 项目结构详解
- `.kiro/steering/type-sync.md` - 类型同步详细说明
- `docs/TYPE_SYNC.md` - 类型同步文档
- `apps/api/README.md` - 后端文档
- `apps/web/README.md` - 前端文档
