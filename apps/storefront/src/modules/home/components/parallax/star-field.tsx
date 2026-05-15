"use client"

import { motion, useTransform, type MotionValue } from "framer-motion"

type Star = {
  x: number
  y: number
  size: number
  baseOpacity: number
  twinkleDuration: number
  twinkleDelay: number
  hue: number
  glow: "none" | "soft" | "bright"
}

/**
 * Deterministic PRNG (mulberry32). Same seed → same star layout
 * on server and client, so SSR markup matches client hydration.
 */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

/**
 * Three-tier distribution for realism:
 *   - 70% dust  — tiny, dim, no glow
 *   - 25% mid   — medium, soft glow
 *   - 5%  bright — large, prominent glow halo
 * Y is biased toward the top half (skewed quadratic) so the
 * sky feels denser overhead and thins toward the horizon.
 */
function generateStars(count: number, seed: number): Star[] {
  const rand = mulberry32(seed)
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    const tier = rand()
    let size: number
    let baseOpacity: number
    let glow: Star["glow"]

    if (tier < 0.7) {
      size = 0.6 + rand() * 0.7
      baseOpacity = 0.35 + rand() * 0.3
      glow = "none"
    } else if (tier < 0.95) {
      size = 1.4 + rand() * 0.7
      baseOpacity = 0.55 + rand() * 0.3
      glow = "soft"
    } else {
      size = 2.8 + rand() * 2.7
      baseOpacity = 0.8 + rand() * 0.2
      glow = "bright"
    }

    // Biased Y: denser near top of sky, thinning toward horizon
    const yRoll = rand()
    const y = yRoll * yRoll * 78 // 0–78% of container height

    stars.push({
      x: rand() * 100,
      y,
      size,
      baseOpacity,
      twinkleDuration: 2.2 + rand() * 4.5,
      twinkleDelay: rand() * 6,
      // 70% cool blue-white, 30% warm white — like real stellar classes
      hue: rand() < 0.7 ? 200 + rand() * 40 : 35 + rand() * 25,
      glow,
    })
  }
  return stars
}

const STARS: readonly Star[] = generateStars(480, 1729)

function glowShadow(
  size: number,
  hue: number,
  kind: Star["glow"]
): string | undefined {
  if (kind === "none") return undefined
  if (kind === "soft") {
    return `0 0 ${size * 3}px hsla(${hue}, 45%, 88%, 0.45)`
  }
  // bright: layered halo + faint outer bloom
  return `
    0 0 ${size * 2.5}px hsla(${hue}, 60%, 92%, 0.7),
    0 0 ${size * 6}px hsla(${hue}, 55%, 85%, 0.35),
    0 0 ${size * 12}px hsla(${hue}, 50%, 80%, 0.12)
  `
}

type StarFieldProps = {
  progress: MotionValue<number>
  visible: boolean
  driftDistancePx: number
}

/**
 * Procedural night-sky starfield. Stars are real DOM nodes with
 * CSS twinkle animations (opacity + scale, GPU-cheap). Brighter
 * stars get a layered box-shadow halo. The whole field drifts
 * downward slightly as the user scrolls for parallax depth.
 */
export function StarField({
  progress,
  visible,
  driftDistancePx,
}: StarFieldProps) {
  const y = useTransform(progress, [0, 1], [0, driftDistancePx])

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none parallax-stars"
      style={{
        y,
        opacity: visible ? 1 : 0,
      }}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="parallax-star"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: `hsl(${s.hue}, 30%, 95%)`,
              boxShadow: glowShadow(s.size, s.hue, s.glow),
              animationDuration: `${s.twinkleDuration}s`,
              animationDelay: `${s.twinkleDelay}s`,
              "--star-opacity": s.baseOpacity,
            } as React.CSSProperties
          }
        />
      ))}
    </motion.div>
  )
}
