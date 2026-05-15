"use client"

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { forwardRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type RadioCardProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> & {
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  right?: ReactNode
  selected?: boolean
}

export const RadioCard = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(
  (
    { title, description, badge, right, selected, className, ...props },
    ref
  ) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn("radio-card", selected && "is-on", className)}
        {...props}
      >
        <span className="bullet" aria-hidden />
        <span className="info">
          <span className="title">{title}</span>
          {description && <span className="desc">{description}</span>}
          {badge && <span className="badge">{badge}</span>}
        </span>
        {right && <span className="price">{right}</span>}
      </RadioGroupPrimitive.Item>
    )
  }
)
RadioCard.displayName = "RadioCard"
