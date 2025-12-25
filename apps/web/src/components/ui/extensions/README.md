# UI 组件扩展

本目录用于存放基于 shadcn/ui 基础组件的扩展版本。

## 使用场景

当需要对基础 UI 组件进行大量自定义时，应在此目录创建扩展组件，而不是直接修改 `src/components/ui/*` 中的原始组件。

## 扩展模式

### 组合模式（推荐）

使用组合模式创建扩展组件，通过包装基础组件并添加额外功能：

```tsx
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
}

export const EnhancedButton = React.forwardRef<
  HTMLButtonElement,
  EnhancedButtonProps
>(({ loading, icon, children, className, disabled, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn("relative", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
});

EnhancedButton.displayName = "EnhancedButton";
```

### 样式扩展模式

通过 `className` prop 扩展样式，保持基础组件不变：

```tsx
import { Button } from "@/components/ui/button";

export const PrimaryButton = ({ className, ...props }) => (
  <Button
    className={cn("bg-blue-600 hover:bg-blue-700", className)}
    {...props}
  />
);
```

## 命名规范

- 扩展组件名称应清晰表明其用途
- 使用 PascalCase 命名
- 文件名与组件名保持一致

## 示例

- `enhanced-button.tsx` - 带加载状态的按钮扩展
- `icon-button.tsx` - 图标按钮扩展
- `form-button.tsx` - 表单专用按钮扩展

## 注意事项

- ✅ 扩展组件应保持与基础组件 API 兼容
- ✅ 使用 `cn()` 工具函数合并类名
- ✅ 遵循 shadcn/ui 的设计模式（forwardRef、displayName）
- ✅ 在文件顶部添加 JSDoc 注释说明扩展目的

