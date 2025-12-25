# UI 组件开发指南

本指南说明如何在 Nexus Console 项目中管理和使用 shadcn/ui 组件，确保 UI 统一性和向后兼容性。

## 快速开始

### 添加新组件

```bash
# 使用 shadcn CLI 添加组件
npx shadcn@latest add [component-name]

# 示例：添加 dialog 组件
npx shadcn@latest add dialog
```

### 验证配置

```bash
# 验证 components.json 和 Tailwind 配置一致性
pnpm validate:ui-config
```

## 组件分层架构

```
src/
├── components/
│   ├── ui/                    # 基础层：shadcn/ui 官方组件
│   │   ├── button.tsx        # 最小修改，带变更日志
│   │   ├── card.tsx
│   │   └── ...
│   ├── ui/extensions/         # 扩展层：UI 组件扩展
│   │   ├── enhanced-button.tsx
│   │   └── README.md
│   └── [feature]/             # 业务层：业务组件
│       └── user-card.tsx
└── routes/                    # 页面层：使用业务组件
```

## 组件使用规范

### ✅ 推荐做法

1. **优先使用基础组件**
   ```tsx
   import { Button } from "@/components/ui/button"
   <Button variant="default">Click me</Button>
   ```

2. **通过 className 扩展样式**
   ```tsx
   <Button className="w-full bg-blue-600">Custom Button</Button>
   ```

3. **创建扩展组件（需要大量自定义时）**
   ```tsx
   import { EnhancedButton } from "@/components/ui/extensions/enhanced-button"
   <EnhancedButton loading={isLoading}>Submit</EnhancedButton>
   ```

### ❌ 禁止做法

1. **直接修改基础组件源码**（除非记录变更日志）
2. **不使用 cn() 函数合并类名**
3. **硬编码颜色值**（应使用 CSS 变量）
4. **破坏组件 API 兼容性**

## 组件更新流程

### 更新现有组件

1. **备份当前组件**
   ```bash
   cp src/components/ui/button.tsx src/components/ui/button.tsx.backup
   ```

2. **使用 CLI 更新**
   ```bash
   npx shadcn@latest add button --overwrite
   ```

3. **合并自定义修改**
   - 查看备份文件中的自定义修改
   - 手动合并到新版本
   - 更新文件顶部的变更日志

4. **测试验证**
   - 检查所有使用该组件的页面
   - 确保样式和功能正常

## 组件变更日志

每个 UI 组件文件顶部都应包含变更日志：

```typescript
/**
 * @fileoverview Button component from shadcn/ui
 * @source https://ui.shadcn.com/docs/components/button
 * @style new-york
 * @baseColor zinc
 *
 * @changelog
 * - 2025-12-25: Initial installation
 *   - No custom modifications
 * - 2025-12-26: Added custom variant
 *   - Added "success" variant for positive actions
 *   - Migration: Update className from "bg-green-600" to variant="success"
 */
```

## 扩展组件开发

### 何时创建扩展组件

- 需要添加新功能（如 loading 状态）
- 需要组合多个基础组件
- 需要业务特定的样式或行为

### 扩展组件模板

```tsx
/**
 * @fileoverview [Component] - Extended version
 * @extends [BaseComponent] from @/components/ui/[component]
 */

import { BaseComponent, type BaseComponentProps } from "@/components/ui/[component]";
import { cn } from "@/lib/utils";

export interface ExtendedComponentProps extends BaseComponentProps {
  // 新增 props
}

export const ExtendedComponent = React.forwardRef<
  HTMLElement,
  ExtendedComponentProps
>(({ /* new props */, className, ...props }, ref) => {
  return (
    <BaseComponent
      ref={ref}
      className={cn(/* custom classes */, className)}
      {...props}
    >
      {/* extended content */}
    </BaseComponent>
  );
});

ExtendedComponent.displayName = "ExtendedComponent";
```

## 配置管理

### components.json

关键配置项：
- `style`: "new-york" (统一风格)
- `baseColor`: "zinc" (基础颜色)
- `cssVariables`: true (启用 CSS 变量)
- `aliases`: 路径别名配置

### 配置变更流程

1. 团队评审配置变更
2. 更新 components.json
3. 同步更新 Tailwind 配置（如需要）
4. 运行验证脚本：`pnpm validate:ui-config`
5. 测试所有组件

## 检查清单

### 添加新组件前
- [ ] 检查 shadcn/ui 是否有官方组件
- [ ] 确认 components.json 配置正确
- [ ] 使用 CLI 添加组件
- [ ] 添加变更日志模板
- [ ] 验证组件正常工作

### 自定义组件时
- [ ] 优先使用 className prop
- [ ] 如需修改源码，记录变更日志
- [ ] 保持 API 向后兼容
- [ ] 使用 CSS 变量而非硬编码

### 更新组件时
- [ ] 备份当前组件文件
- [ ] 使用 `--overwrite` 更新
- [ ] 手动合并自定义修改
- [ ] 更新变更日志
- [ ] 测试所有使用该组件的页面

## 相关资源

- [shadcn/ui 文档](https://ui.shadcn.com)
- [组件扩展指南](./extensions/README.md)
- [配置验证脚本](../../scripts/validate-ui-config.js)

