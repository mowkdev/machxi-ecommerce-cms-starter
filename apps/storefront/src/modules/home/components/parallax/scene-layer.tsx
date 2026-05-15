"use client"

import { motion, useTransform, type MotionValue } from "framer-motion"

import type { BreakpointKey, ParallaxLayer } from "@/config/parallax"

type SceneLayerProps = {
  layer: ParallaxLayer
  progress: MotionValue<number>
  z: number
  bp: BreakpointKey
  stageW: number
  stageH: number
  theme: "day" | "night"
}

/**
 * Render a single parallax layer. Geometry, parallax translation,
 * and z-index are all set inline from the layer's per-breakpoint
 * config. Two render variants share the same motion wrapper:
 *
 *  - `image` : SVG rendered as <img>, preserving its own colors;
 *              filters can be themed per day/night.
 *  - `mask`  : SVG used as a CSS mask, filled with `colorVar` — for
 *              tinted silhouettes.
 */
export function SceneLayer({
  layer,
  progress,
  z,
  bp,
  stageW,
  stageH,
  theme,
}: SceneLayerProps) {
  const bpCfg = layer.breakpoints[bp]
  const { start, travel, maskPosition, width, x } = bpCfg
  const startX = bpCfg.startX ?? 0
  const travelX = bpCfg.travelX ?? 0

  const aspect =
    layer.naturalWidth && layer.naturalHeight
      ? layer.naturalWidth / layer.naturalHeight
      : null
  const constrained = width !== undefined && aspect !== null

  let widthPx: number
  let heightPx: number
  let left: string | number
  if (constrained) {
    widthPx = (stageW * width!) / 100
    heightPx = widthPx / aspect!
    const xOffsetPx = (stageW * (x ?? 0)) / 100
    left = `calc(50% - ${widthPx / 2}px + ${xOffsetPx}px)`
  } else {
    widthPx = stageW
    heightPx = stageH
    left = 0
  }

  // Vertical parallax (% of stage height → px)
  const motionY = useTransform(
    progress,
    [0, 1],
    [(stageH * start) / 100, (stageH * (start + travel)) / 100]
  )

  // Horizontal parallax (% of stage width → px)
  const motionX = useTransform(
    progress,
    [0, 1],
    [(stageW * startX) / 100, (stageW * (startX + travelX)) / 100]
  )

  // Visibility per theme — undefined means always visible
  const vis = layer.visibility
  const opacity = vis
    ? (theme === "day" ? vis.day : vis.night)
      ? 1
      : 0
    : undefined

  const renderMode = layer.renderMode ?? "mask"

  const baseStyle = {
    left,
    top: 0,
    width: widthPx,
    height: heightPx,
    x: motionX,
    y: motionY,
    zIndex: z,
    opacity,
  } as const

  if (renderMode === "image") {
    const filter = layer.filters
      ? theme === "day"
        ? layer.filters.day
        : layer.filters.night
      : undefined

    return (
      <motion.div
        aria-hidden
        className="parallax-layer parallax-layer--image"
        style={{ ...baseStyle, filter }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG mask layer, no benefit from next/image optimization */}
        <img
          src={layer.mask}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "fill",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </motion.div>
    )
  }

  const resolvedMaskPosition = maskPosition ?? "0 0"
  const maskStyle = {
    ["--layer-color" as never]: layer.colorVar
      ? `var(${layer.colorVar})`
      : "transparent",
    WebkitMaskImage: `url(${layer.mask})`,
    maskImage: `url(${layer.mask})`,
    WebkitMaskPosition: resolvedMaskPosition,
    maskPosition: resolvedMaskPosition,
  } as const

  // Sway lives on an inner element so its CSS transform doesn't
  // collide with Framer Motion's transform on the outer wrapper.
  // The inner element pivots from its own bottom-center, which is
  // the bottom of the layer box — i.e. where tree silhouettes are
  // anchored by `maskPosition: "50% 9x%"`.
  if (layer.sway) {
    const swayBp = layer.sway.breakpoints[bp]
    const swayVars = {
      ["--sway-skew" as never]: swayBp.skewDeg,
      ["--sway-duration" as never]: `${swayBp.durationSec}s`,
      ["--sway-delay" as never]: `${layer.sway.phaseSec ?? 0}s`,
      ["--sway-origin" as never]: layer.sway.origin ?? "50% 100%",
    }
    return (
      <motion.div
        aria-hidden
        className="parallax-layer"
        style={baseStyle}
      >
        <div
          className="parallax-layer__sway parallax-layer--mask"
          style={{ ...maskStyle, ...swayVars }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      aria-hidden
      className="parallax-layer parallax-layer--mask"
      style={{ ...baseStyle, ...maskStyle }}
    />
  )
}
