# 项目结构

## Monorepo 组织

项目采用 Turborepo 管理的 Monorepo 结构，使用 pnpm workspace。

```
nexus-console/
├── apps/
│   ├── api/                    # Python FastAPI 后端
│   │   ├── app/
│   │   │   ├── main.py         # FastAPI 入口
│   │   │   ├── config.py       # 配置
│   │   │   ├── database.py     # 数据库连接
│   │   │   ├── models/         # SQLAlchemy 模型
│   │   │   ├── schemas/        # Pydantic 模型
│   │   │   ├── api/            # API 路由
│   │   │   │   └── v1/
│   │   │   ├── core/           # 核心功能
│   │   │   └── tests/
│   │   ├── alembic/            # 数据库迁移
│   │   ├── pyproject.toml
│   │   └── .env
│   └── web/                    # React 前端应用
│       ├── src/
│       │   ├── main.tsx        # 应用入口
│       │   ├── routes/         # TanStack Router 路由
│       │   ├── components/     # 组件
│       │   │   └── ui/         # UI 组件
│       │   ├── lib/            # 工具函数
│       │   ├── stores/         # Zustand 状态
│       │   ├── hooks/          # 自定义 Hooks
│       │   └── types/          # TypeScript 类型
│       ├── public/
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── package.json
├── .kiro/steering/             # AI 指导规则
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
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

## Git 提交规范

必须遵循 Conventional Commits：

```
feat(scope): description    # 新功能
fix(scope): description     # 修复
docs(scope): description    # 文档
refactor(scope): description # 重构
test(scope): description    # 测试
chore(scope): description   # 杂项
perf(scope): description    # 性能
```
