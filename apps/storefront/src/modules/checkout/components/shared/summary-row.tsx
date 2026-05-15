import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function SummaryRow({
  cols = 2,
  children,
}: {
  cols?: 2 | 3
  children: ReactNode
}) {
  return (
    <div className={cn("summary-row", cols === 3 && "cols-3")}>{children}</div>
  )
}

export function SummaryCell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="lbl">{label}</div>
      <div className="val">{children}</div>
    </div>
  )
}
