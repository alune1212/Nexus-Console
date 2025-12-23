# 技术栈

## 构建系统

- **Monorepo 管理**: Turborepo 2.7+
- **包管理器**: pnpm 10.26+ (禁止使用 npm/yarn)
- **工作区**: pnpm workspace

## 后端技术栈 (apps/api)

| 技术           | 版本要求 | 说明                                    |
| -------------- | -------- | --------------------------------------- |
| Python         | 3.13+    | 必须启用类型注解                        |
| uv             | latest   | 包管理器，禁止使用 pip/poetry/pipenv    |
| FastAPI        | 0.127+   | Web 框架，禁止使用 Flask/Django         |
| SQLAlchemy     | 2.0+     | ORM，**必须使用 Async 模式**            |
| Pydantic       | v2       | 数据验证，禁止使用 v1 语法              |
| Ruff           | latest   | 代码检查和格式化，禁止使用 Black/flake8 |
| asyncpg        | 0.31+    | PostgreSQL 异步驱动                     |
| Celery         | 5.6+     | 任务队列                                |
| Redis          | 7.1+     | 缓存                                    |
| Uvicorn        | 0.40+    | ASGI 服务器 (带 standard 扩展)          |
| structlog      | 25.5+    | 结构化日志                              |
| pytest         | 9.0+     | 测试框架                                |
| slowapi        | 0.1.9+   | API 限流                                |
| fastapi-cache2 | 0.2.2+   | FastAPI 缓存                            |

### 后端禁止使用

- ❌ Flask / Django / Tornado
- ❌ pip / poetry / pipenv（使用 uv）
- ❌ SQLAlchemy 同步模式（必须用异步）
- ❌ Pydantic v1 语法
- ❌ Black / isort / flake8（使用 Ruff）
- ❌ requests（使用 httpx）

## 前端技术栈 (apps/web)

| 技术            | 版本要求 | 说明                            |
| --------------- | -------- | ------------------------------- |
| Node.js         | 20+ LTS  | 运行环境                        |
| pnpm            | 10+      | 包管理器，禁止使用 npm/yarn     |
| Vite            | 5.x+     | 构建工具，禁止使用 Webpack/CRA  |
| React           | 19.x     | UI 框架                         |
| TypeScript      | 5.x      | 必须启用 `strict: true`         |
| TanStack Router | latest   | 路由，禁止使用 React Router     |
| TanStack Query  | v5       | 数据获取，禁止使用 SWR/Redux    |
| Zustand         | latest   | 客户端状态，禁止使用 Redux/MobX |
| Tailwind CSS    | 3.x/4.x  | 样式，禁止使用 CSS-in-JS        |
| shadcn/ui       | latest   | UI 组件库                       |
| React Hook Form | 7.x      | 表单，禁止使用 Formik           |
| Zod             | 4.x      | 验证，禁止使用 Yup/Joi          |
| date-fns        | latest   | 日期处理，禁止使用 moment.js    |
| Lucide React    | latest   | 图标库                          |
| sonner          | latest   | Toast 通知                      |
| Orval           | 7.x      | OpenAPI 代码生成器              |
| Vitest          | 4.x      | 单元测试框架                    |
| Playwright      | 1.x      | E2E 测试框架                    |

### 前端禁止使用

- ❌ npm / yarn（使用 pnpm）
- ❌ Webpack / Create React App（使用 Vite）
- ❌ React Router（使用 TanStack Router）
- ❌ Redux / Redux Toolkit / SWR（使用 TanStack Query + Zustand）
- ❌ Styled-Components / Emotion（使用 Tailwind CSS）
- ❌ Formik（使用 React Hook Form）
- ❌ Yup / Joi（使用 Zod）
- ❌ Axios（使用 fetch 或 TanStack Query 内置）
- ❌ Moment.js（使用 date-fns）

## 数据库与基础设施

| 技术       | 版本要求 | 说明                          |
| ---------- | -------- | ----------------------------- |
| PostgreSQL | 16+      | 数据库，禁止使用 MySQL/SQLite |
| Redis      | 7+       | 缓存和队列                    |
| Docker     | latest   | 容器化                        |

## 常用命令

### 根目录命令

```bash
pnpm dev              # 启动所有应用的开发服务器
pnpm build            # 构建所有应用
pnpm lint             # 运行代码检查
pnpm test             # 运行所有测试
pnpm types:sync       # 同步前后端类型（OpenAPI → TypeScript）
pnpm release          # 创建新版本（自动生成 CHANGELOG）
pnpm release:minor    # 创建 minor 版本
pnpm release:major    # 创建 major 版本
pnpm release:patch    # 创建 patch 版本
```

### 后端 API (apps/api)

```bash
# 依赖管理
uv sync                              # 安装依赖
uv add <package>                     # 添加生产依赖
uv add --dev <package>               # 添加开发依赖

# 开发
pnpm --filter api dev                # 启动开发服务器
pnpm --filter api openapi:export     # 导出 OpenAPI 规范

# 数据库
pnpm --filter api db:migrate         # 运行数据库迁移
pnpm --filter api db:revision        # 创建新迁移

# 代码质量
pnpm --filter api lint               # 代码检查 (Ruff)
pnpm --filter api format             # 代码格式化 (Ruff)
pnpm --filter api type-check         # 类型检查 (MyPy)

# 测试
pnpm --filter api test               # 运行测试
pnpm --filter api test:coverage      # 测试覆盖率
```

### 前端 Web (apps/web)

```bash
# 开发
pnpm --filter web dev                # 启动开发服务器
pnpm --filter web build              # 构建生产版本
pnpm --filter web preview            # 预览生产构建

# API 客户端生成
pnpm --filter web api:generate       # 从 OpenAPI 生成 TypeScript 客户端

# 代码质量
pnpm --filter web lint               # ESLint 检查

# 测试
pnpm --filter web test               # 运行单元测试
pnpm --filter web test:ui            # 测试 UI 模式
pnpm --filter web test:coverage      # 测试覆盖率
pnpm --filter web test:e2e           # 运行 E2E 测试
pnpm --filter web test:e2e:ui        # E2E 测试 UI 模式
```

### 类型同步工作流

```bash
# 完整的类型同步流程
pnpm types:sync

# 等价于：
# 1. pnpm --filter api openapi:export    # 导出 OpenAPI 规范
# 2. pnpm --filter web api:generate      # 生成 TypeScript 客户端
```

## 开发环境要求

- Node.js 20+ LTS
- Python 3.13+
- pnpm 10.26+
- uv (Python 包管理器)
- PostgreSQL 16+
- Redis 7+
