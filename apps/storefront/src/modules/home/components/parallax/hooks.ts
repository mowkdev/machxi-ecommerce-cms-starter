"use client"

import { useEffect, useState } from "react"

import type { BreakpointKey } from "@/config/parallax"

/**
 * Resolve a viewport width to the matching breakpoint key, using
 * the configured min-width thresholds. Picks the largest bp whose
 * threshold is <= width. Falls back to the smallest bp.
 */
function resolveBreakpoint(
  width: number,
  thresholds: Record<BreakpointKey, number>
): BreakpointKey {
  const sorted = (Object.entries(thresholds) as [BreakpointKey, number][]).sort(
    ([, a], [, b]) => b - a
  )
  for (const [key, threshold] of sorted) {
    if (width >= threshold) return key
  }
  return sorted[sorted.length - 1][0]
}

/**
 * Reactive hook that tracks the current breakpoint based on
 * `window.innerWidth` and the configured thresholds. Server-renders
 * with a sensible default to avoid hydration mismatches; the client
 * corrects on first effect.
 *
 * Returns `[bp, hydrated, width]`. `hydrated` flips to `true` after
 * the first client measurement so callers can gate rendering until
 * the real breakpoint is known. `width` is exposed so dev tooling
 * can display it without spinning up a second resize listener.
 */
export function useBreakpoint(
  thresholds: Record<BreakpointKey, number>
): [BreakpointKey, boolean, number | null] {
  const [bp, setBp] = useState<BreakpointKey>("lg")
  const [hydrated, setHydrated] = useState(false)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      setWidth(w)
      setBp(resolveBreakpoint(w, thresholds))
    }
    compute()
    setHydrated(true)
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [thresholds])

  return [bp, hydrated, width]
}

/**
 * Preloads an array of image URLs and resolves when all are decoded
 * (or errored — we don't block on broken assets). Pass a stable
 * reference (e.g. module-level constant) to avoid retriggering.
 */
export function useImagesReady(srcs: readonly string[]): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const promises = srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.src = src
          img.decode().then(
            () => resolve(),
            () => resolve()
          )
        })
    )
    Promise.all(promises).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [srcs])

  return ready
}
