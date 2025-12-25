/**
 * @fileoverview Input component from shadcn/ui
 * @source https://ui.shadcn.com/docs/components/input
 * @style new-york
 * @baseColor zinc
 *
 * @changelog
 * - 2025-12-25: Initial installation from shadcn/ui
 *   - No custom modifications
 *   - Follows shadcn/ui new-york style
 *
 * @usage
 * ```tsx
 * import { Input } from "@/components/ui/input"
 * <Input type="email" placeholder="Enter email" />
 * ```
 *
 * @note
 * - To customize: Use className prop or create wrapper component
 * - To update: Run `npx shadcn@latest add input --overwrite`
 * - Remember to merge any custom changes after update
 */

import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
