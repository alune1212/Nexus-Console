# 当前任务：在 /admin/rbac UI 中支持设置角色互斥组与优先级

## 当前目标
在 `/admin/rbac` 的角色创建/编辑中支持设置 `exclusive_group` 与 `priority`，避免手动改 DB；对系统角色（admin/user）保持只读，避免误改。

## 实施进度
- ⏳ 待完成：后端 RoleCreate/RoleUpdate 支持 `exclusive_group/priority` 写入（`is_system` 禁止客户端设置）
- ⏳ 待完成：前端 `/admin/rbac` 角色创建/编辑 UI 增加 `exclusive_group/priority` 输入与保存

## 下一步（短期）
1. 修改后端 schema + RBAC role create/update 路由，导出 OpenAPI 并 `pnpm types:sync`。
2. 前端新增表单字段与保存按钮（编辑选中角色），并对系统角色只读展示。
