# 产品概述

Nexus-Console 是一个现代化全栈应用控制台，采用生产就绪的技术栈构建。

## 核心特性

- 🔒 **生产就绪**: Docker 容器化、CI/CD 自动化、安全配置完善
- 🚀 **高性能**: 数据库连接池、GZip 压缩、API 限流、Redis 缓存
- ✅ **测试完善**: 前后端测试框架配置完成，覆盖率 80%+
- 🛠️ **开发体验**: Git hooks、commitlint、VSCode 配置、快速启动脚本
- 📚 **文档完整**: 贡献指南、安全政策、详细的技术文档
- 🔄 **类型同步**: 自动化的前后端类型同步机制（OpenAPI → TypeScript）

## 技术架构

- **后端 API**: FastAPI + SQLAlchemy 2.0 异步模式 + Pydantic v2
- **前端界面**: React 19 + TypeScript + TanStack Router/Query + Zustand
- **数据存储**: PostgreSQL 16+ 关系型数据库
- **缓存层**: Redis 7+ 缓存和任务队列
- **异步任务**: Celery 5.6+ 任务队列
- **构建系统**: Turborepo + pnpm workspace + uv (Python)

## 架构模式

采用 Monorepo 架构，使用 Turborepo 管理多个应用和包，实现：

- 统一的依赖管理和版本控制
- 高效的增量构建和缓存
- 前后端类型自动同步
- 统一的代码规范和提交规范
