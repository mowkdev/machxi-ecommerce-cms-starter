import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<"input">

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-[52px] w-full rounded-[4px] border bg-[var(--paper)] px-[14px] py-3 text-[14px] text-[var(--ink)] outline-none transition-colors",
          "border-[color-mix(in_srgb,var(--ink)_18%,transparent)]",
          "placeholder:text-[color-mix(in_srgb,var(--ink)_35%,transparent)]",
          "hover:border-[color-mix(in_srgb,var(--ink)_38%,transparent)]",
          "focus-visible:border-[var(--ink)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-[var(--accent-deep)]",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
