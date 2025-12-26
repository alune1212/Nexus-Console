# 当前任务：RBAC（角色 + 权限）系统落地

## 当前目标
实现 RBAC（Role + Permission），后端基于数据库实时加载角色/权限并进行授权校验；前端提供权限 Hook、路由守卫与管理员管理 UI。

## 实施进度
- ✅ 已完成 RBAC 全链路落地：
  - 数据模型：Role / Permission + 关联表 + 默认 seed
  - 后端依赖：`get_current_user` DB 实时加载 roles->permissions；`require_permissions`
  - RBAC 管理 API：`/api/v1/roles`、`/api/v1/permissions`、`/api/v1/roles/{id}/permissions`
  - 用户接口权限保护：`/api/v1/users/*` 读写权限点控制（并移除易泄露的缓存装饰器）
  - types:sync：OpenAPI → orval 已同步（生成 CurrentUserResponse、rbac endpoints）
  - 前端能力：`usePermission`、route guards、`/forbidden`、`/admin/rbac` 管理页
  - 测试：后端/前端测试均通过

## 下一步（短期）
1. 在 `apps/api/.env` 配置 `ADMIN_EMAILS`（逗号分隔），确保首个管理员可进入 `/admin/rbac`。
2. 按需扩展权限点与“用户角色分配 UI”（当前后端已提供 `PUT /api/v1/users/{user_id}/roles`）。
3. 若要更细粒度控制：把路由/按钮权限（如 users:write）推广到更多页面与操作。
