## Current Objective

为 Nexus Console 新增 Cursor 测试规则（后端 pytest + 前端 vitest），使 AI 在编写/修改测试时遵循项目既有约定与最佳实践。

## Progress

- 已确认后端 pytest 配置与 fixture 结构（`apps/api/pyproject.toml`、`app/tests/conftest.py`）。
- 已确认前端 vitest 配置、测试目录与常见 mock/渲染模式（`apps/web/vitest.config.ts`、`src/test/*`、`*.test.ts*`）。
- 已新增规则文件：
  - `.cursor/rules/testing-pytest.mdc`
  - `.cursor/rules/testing-vitest.mdc`

## Next Steps

- 检查新规则文件是否有格式/拼写问题（必要时微调 `globs` 覆盖范围）。
- 若你希望把 `setup.ts`/`vitest.config.ts` 也纳入规则触发范围，按 Cursor 对 `globs` 支持情况扩展为多 pattern 或拆分更细的规则文件。

# 项目整体审查

## 当前目标
对 Nexus Console 项目进行全面审查，包括代码质量、架构设计、安全性、测试覆盖、文档完整性等方面。

## 审查进度
- ✅ 项目结构分析
- ✅ 配置文件审查
- ✅ 代码质量检查（linting）
- ✅ 安全机制审查
- ✅ 错误处理机制审查
- ✅ 数据库迁移策略审查
- ✅ 前后端类型同步机制审查
- ✅ 测试结构审查
- ✅ 生成审查报告

## 审查结果
总体评分：**8.5/10**

### 优势
- 现代化技术栈，架构设计清晰
- 代码质量高，类型安全完善
- 安全机制健全，配置已优化
- 文档全面，监控配置完整

### 需要改进
- 缺少 CI/CD 工作流（高优先级）
- 前端测试覆盖率需提升（高优先级）
- 数据库连接池配置需验证（中优先级）

## 审查报告
详细报告已生成：`docs/PROJECT_REVIEW_2025.md`
