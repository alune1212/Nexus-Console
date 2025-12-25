/**
 * @fileoverview Enhanced Button - Extended version of shadcn/ui Button
 * @extends Button from @/components/ui/button
 *
 * @description
 * This component extends the base Button component with additional features:
 * - Loading state with spinner
 * - Optional icon support
 * - Maintains full API compatibility with base Button
 *
 * @usage
 * ```tsx
 * import { EnhancedButton } from "@/components/ui/extensions/enhanced-button"
 * <EnhancedButton loading={isLoading} icon={<Icon />}>
 *   Submit
 * </EnhancedButton>
 * ```
 *
 * @note
 * This is an extension component. The base Button remains unchanged.
 * To update base Button: Run `npx shadcn@latest add button --overwrite`
 */

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface EnhancedButtonProps extends ButtonProps {
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Optional icon to display before text */
  icon?: React.ReactNode;
}

/**
 * Enhanced Button component with loading state and icon support
 */
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
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
});

EnhancedButton.displayName = "EnhancedButton";
