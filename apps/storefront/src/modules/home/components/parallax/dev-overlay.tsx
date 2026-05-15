"use client"

import type { BreakpointKey } from "@/config/parallax"

type DevOverlayProps = {
  bp: BreakpointKey
  width: number | null
}

/**
 * Tiny corner badge showing the live viewport width and resolved
 * breakpoint. Only rendered in development. Takes its data as
 * props so it doesn't run a second resize listener.
 */
export function DevBreakpointOverlay({ bp, width }: DevOverlayProps) {
  return (
    <div
      aria-hidden
      className="fixed bottom-3 right-3 z-[9999] font-mono text-[11px] tracking-wide bg-black/75 text-white px-2.5 py-1.5 rounded-md pointer-events-none select-none backdrop-blur-sm shadow-md"
    >
      <span className="opacity-60">vw</span>{" "}
      <span className="tabular-nums">{width ?? "—"}</span>
      <span className="opacity-30 mx-1.5">·</span>
      <span className="opacity-60">bp</span>{" "}
      <span className="text-amber-300">{bp}</span>
    </div>
  )
}
