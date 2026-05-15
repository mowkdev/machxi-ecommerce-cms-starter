"use client"

import { motion, useTransform, type MotionValue } from "framer-motion"

type Mote = {
  x: number
  y: number
  size: number
  baseOpacity: number
  duration: number
  delay: number
  hue: number
  driftX: number
  driftY: number
}

/**
 * Deterministic PRNG (mulberry32). Same seed → same mote layout
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
 * Three tiers tuned for "sunlit dust in air":
 *   - 75% tiny haze   — barely-there specks, build up volumetric feel
 *   - 22% mid motes   — visible particles, soft glow
 *   - 3%  pollen      — occasional warm specks catching direct light
 *
 * Y biased toward the middle band (20–80%) where sunlight reads
 * strongest against the sky/foliage backdrop. Top of sky and the
 * lake water stay relatively clean.
 */
function generateMotes(count: number, seed: number): Mote[] {
  const rand = mulberry32(seed)
  const motes: Mote[] = []
  for (let i = 0; i < count; i++) {
    const tier = rand()
    let size: number
    let baseOpacity: number

    if (tier < 0.65) {
      size = 1.5 + rand() * 1.8
      baseOpacity = 0.32 + rand() * 0.26
    } else if (tier < 0.93) {
      size = 3.2 + rand() * 2.5
      baseOpacity = 0.55 + rand() * 0.28
    } else {
      size = 5.5 + rand() * 4
      baseOpacity = 0.72 + rand() * 0.18
    }

    motes.push({
      x: rand() * 100,
      y: 4 + rand() * 90,
      size,
      baseOpacity,
      // Slow drift — 10–24s per cycle keeps it ambient, not busy
      duration: 10 + rand() * 14,
      delay: rand() * 12,
      // White with the faintest warm tint
      hue: 40 + rand() * 10,
      // Local sway, larger motes drift further (they're "closer")
      driftX: (rand() - 0.5) * 60,
      driftY: -(15 + rand() * 35),
    })
  }
  return motes
}

const MOTES: readonly Mote[] = generateMotes(540, 8675)

type DustFieldProps = {
  progress: MotionValue<number>
  visible: boolean
  driftDistancePx: number
}

/**
 * Daytime atmospheric dust/pollen. Each mote drifts in a small
 * local loop with a gentle opacity pulse — the effect reads as
 * sunlit air rather than falling dust. The whole field also
 * drifts subtly with scroll for parallax depth, opposite the
 * starfield's direction so the two never fight each other.
 */
export function DustField({
  progress,
  visible,
  driftDistancePx,
}: DustFieldProps) {
  const y = useTransform(progress, [0, 1], [0, driftDistancePx])

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none parallax-motes"
      style={{ y, opacity: visible ? 1 : 0 }}
    >
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="parallax-mote"
          style={
            {
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              background: `radial-gradient(circle, hsla(${m.hue}, 20%, 100%, 1) 0%, hsla(${m.hue}, 15%, 98%, 0.8) 45%, hsla(${m.hue}, 10%, 94%, 0) 78%)`,
              animationDuration: `${m.duration}s`,
              animationDelay: `${m.delay}s`,
              "--mote-opacity": m.baseOpacity,
              "--mote-drift-x": `${m.driftX}px`,
              "--mote-drift-y": `${m.driftY}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </motion.div>
  )
}
