# 项目结构

## Monorepo 组织

项目采用 Turborepo 管理的 Monorepo 结构，使用 pnpm workspace。

```
nexus-console/
├── apps/
│   ├── api/                    # Python FastAPI 后端
│   │   ├── app/
│   │   │   ├── main.py         # FastAPI 入口
│   │   │   ├── config.py       # 配置管理
│   │   │   ├── database.py     # 数据库连接
│   │   │   ├── models/         # SQLAlchemy 模型
│   │   │   ├── schemas/        # Pydantic 模型（API 契约）
│   │   │   ├── api/            # API 路由
│   │   │   │   └── v1/         # API v1 版本
│   │   │   │       ├── router.py
│   │   │   │       └── users.py
│   │   │   ├── core/           # 核心功能
│   │   │   │   ├── cache.py    # Redis 缓存
│   │   │   │   ├── errors.py   # 错误处理
│   │   │   │   └── logging.py  # 结构化日志
│   │   │   └── tests/          # 测试
│   │   ├── alembic/            # 数据库迁移
│   │   ├── openapi/            # OpenAPI 规范（生成）
│   │   ├── scripts/            # 工具脚本
│   │   ├── pyproject.toml      # Python 项目配置
│   │   ├── uv.lock             # 依赖锁定文件
│   │   └── .env                # 环境变量
│   └── web/                    # React 前端应用
│       ├── src/
│       │   ├── main.tsx        # 应用入口
│       │   ├── App.tsx         # 根组件
│       │   ├── routes/         # TanStack Router 路由（文件路由）
│       │   ├── api/            # API 客户端（Orval 生成）
│       │   │   ├── endpoints/  # API Hooks
│       │   │   └── models/     # TypeScript 类型
│       │   ├── components/     # React 组件
│       │   │   └── ui/         # shadcn/ui 组件
│       │   ├── lib/            # 工具函数
│       │   ├── stores/         # Zustand 状态管理
│       │   ├── hooks/          # 自定义 Hooks
│       │   ├── types/          # TypeScript 类型定义
│       │   └── test/           # 测试工具
│       ├── e2e/                # Playwright E2E 测试
│       ├── public/             # 静态资源
│       ├── vite.config.ts      # Vite 配置
│       ├── vitest.config.ts    # Vitest 配置
│       ├── playwright.config.ts # Playwright 配置
│       ├── orval.config.ts     # Orval 配置
│       ├── tailwind.config.js  # Tailwind CSS 配置
│       └── package.json
├── .kiro/steering/             # AI 开发指导规则
├── .github/workflows/          # GitHub Actions CI/CD
├── .husky/                     # Git hooks
├── docs/                       # 项目文档
├── scripts/                    # 项目脚本
├── monitoring/                 # 监控配置（Prometheus/Grafana）
├── docker-compose.yml          # Docker 编排
├── docker-compose.dev.yml      # 开发环境 Docker
├── package.json                # 根 package.json
├── pnpm-workspace.yaml         # pnpm workspace 配置
├── turbo.json                  # Turborepo 配置
├── commitlint.config.js        # Commitlint 配置
└── .versionrc.json             # standard-version 配置
```

## 命名约定

### 后端 (Python)

- 文件名：`snake_case.py`
- 类名：`PascalCase`
- 函数名：`snake_case`
- 变量名：`snake_case`
- 常量：`UPPER_SNAKE_CASE`

### 前端 (TypeScript/React)

- 组件文件：`PascalCase.tsx`
- 工具/hooks 文件：`camelCase.ts`
- 组件名：`PascalCase`
- 函数名：`camelCase`
- 变量名：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- CSS 类名：`kebab-case`（Tailwind）

## 重要目录说明

### 生成的文件（不提交到 Git）

以下目录由工具自动生成，已添加到 `.gitignore`：

- `apps/api/openapi/` - OpenAPI 规范（由 FastAPI 导出）
- `apps/web/src/api/endpoints/` - API Hooks（由 Orval 生成）
- `apps/web/src/api/models/` - TypeScript 类型（由 Orval 生成）
- `apps/web/dist/` - 前端构建产物
- `apps/api/.venv/` - Python 虚拟环境
- `node_modules/` - Node.js 依赖

### 配置文件层级

- **根目录**: Monorepo 工具配置（Turborepo、pnpm、Git hooks）
- **apps/api**: Python 后端配置（pyproject.toml、alembic.ini）
- **apps/web**: 前端配置（vite.config.ts、tailwind.config.js、orval.config.ts）

## Git 提交规范

必须遵循 Conventional Commits，由 commitlint 强制执行：

```
feat(scope): description      # 新功能
fix(scope): description       # 修复
docs(scope): description      # 文档
refactor(scope): description  # 重构
test(scope): description      # 测试
chore(scope): description     # 杂项
perf(scope): description      # 性能优化
style(scope): description     # 代码风格
ci(scope): description        # CI/CD 配置
build(scope): description     # 构建系统
```

**示例**：

```
feat(api): 添加用户认证功能
fix(web): 修复登录表单验证问题
docs: 更新 README 安装说明
chore(release): 完成 CHANGELOG 自动化配置
```

## 版本管理

项目使用 `standard-version` 自动管理版本和 CHANGELOG：

```bash
pnpm release          # 自动判断版本类型
pnpm release:patch    # 1.1.1 → 1.1.2
pnpm release:minor    # 1.1.1 → 1.2.0
pnpm release:major    # 1.1.1 → 2.0.0
```

版本号遵循 [Semantic Versioning](https://semver.org/)。
