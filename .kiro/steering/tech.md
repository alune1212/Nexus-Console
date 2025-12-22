# 技术栈

## 构建系统

- **Monorepo 管理**: Turborepo 2.7+
- **包管理器**: pnpm 10.26+ (禁止使用 npm/yarn)
- **工作区**: pnpm workspace

## 后端技术栈 (apps/api)

| 技术       | 版本要求 | 说明                                    |
| ---------- | -------- | --------------------------------------- |
| Python     | 3.12+    | 必须启用类型注解                        |
| uv         | latest   | 包管理器，禁止使用 pip/poetry/pipenv    |
| FastAPI    | 0.115+   | Web 框架，禁止使用 Flask/Django         |
| SQLAlchemy | 2.0+     | ORM，**必须使用 Async 模式**            |
| Pydantic   | v2       | 数据验证，禁止使用 v1 语法              |
| Ruff       | latest   | 代码检查和格式化，禁止使用 Black/flake8 |
| asyncpg    | 0.31+    | PostgreSQL 异步驱动                     |
| Celery     | 5.6+     | 任务队列                                |
| Redis      | 7.1+     | 缓存                                    |
| Uvicorn    | latest   | ASGI 服务器 (带 standard 扩展)          |

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
| React Hook Form | 7.x      | 表单，禁止使用 Formik           |
| Zod             | 3.x      | 验证，禁止使用 Yup/Joi          |

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
pnpm dev      # 启动所有应用的开发服务器
pnpm build    # 构建所有应用
pnpm lint     # 运行代码检查
```

### 后端 API (apps/api)

```bash
uv sync                        # 安装依赖
uvicorn main:app --reload      # 启动开发服务器
ruff check .                   # 代码检查
ruff format .                  # 代码格式化
```

### 前端 Web (apps/web)

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm preview  # 预览生产构建
pnpm lint     # 运行 ESLint
```

## 开发环境要求

- Node.js 20+ LTS
- Python 3.13+
- pnpm 10.26+
- uv (Python 包管理器)
- PostgreSQL 16+
- Redis 7+
