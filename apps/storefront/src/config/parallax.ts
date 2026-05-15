/**
 * Parallax scene configuration
 * --------------------------------------------------------------
 * The scene is rendered like a fixed-resolution background video:
 * all layers share a single "stage" element whose pixel size
 * (width × height) is set explicitly per breakpoint. The stage is
 * centered in the viewport, and the parent's `overflow: hidden`
 * crops anything that extends past viewport edges.
 *
 * The scroll position drives a normalized progress value `p` in
 * the range [0, 1]. Each layer's Y translation is then:
 *
 *     translateY = (start + p * travel) % of stage height
 *
 * Five breakpoints are exposed: `xs`, `sm`, `md`, `lg`, `xl`.
 *
 * Every layer specifies a *complete* config for every breakpoint
 * (no defaults, no merging) — the lookup is a direct read of
 * `layer.breakpoints[bp]`. This makes each (layer × bp) tuple a
 * deliberate design choice rather than an inherited side effect.
 *
 * Each layer fills the stage 100% × 100%, so silhouettes always
 * stay in registration with the stage's pixel rectangle.
 *
 * Layer add/remove is order-sensitive: first layer = back, last =
 * front (z-index defaults to array order, can be overridden with
 * `z` on the layer).
 */

/** Breakpoint keys, in increasing min-width order. */
export type BreakpointKey = "xs" | "sm" | "md" | "lg" | "xl"

/**
 * Full layer config at a single breakpoint. Every layer must
 * provide one of these for every breakpoint.
 */
export type ParallaxLayerBreakpointConfig = {
  /** Initial vertical offset (when p = 0), as % of stage height. */
  start: number
  /** Total vertical travel as p goes 0 -> 1, as % of stage height. */
  travel: number
  /**
   * Initial horizontal offset (when p = 0), as % of stage width.
   * Optional — defaults to `0` (no horizontal motion). Combine
   * with `travelX` to make a layer drift sideways as the user
   * scrolls — useful for birds, clouds, boats, etc.
   */
  startX?: number
  /**
   * Total horizontal travel as p goes 0 -> 1, as % of stage width.
   * Optional — defaults to `0`.
   */
  travelX?: number
  /**
   * CSS mask-position string, e.g. `"50% 94%"`. Optional — omit
   * for the default `"0 0"`.
   */
  maskPosition?: string
  /**
   * Layer width as % of stage width. Optional.
   *
   * If set (and the layer has `naturalWidth`/`naturalHeight`), the
   * layer renders at this width with its natural SVG aspect ratio
   * preserved (height auto-derived). If unset, the layer stretches
   * to fill the stage 100% × 100% (the old behavior).
   *
   * Use this for layers whose SVG has its own tight viewBox (e.g.
   * a boat, dock, isolated birds) so they don't get blown up to
   * fill the stage.
   */
  width?: number
  /**
   * Horizontal offset from the stage's horizontal center, as % of
   * stage width. `0` = centered, `-20` = 20% left of center, `+10`
   * = 10% right of center. Only applies when `width` is set.
   */
  x?: number
}

/**
 * How a layer is rendered.
 *
 * - `"mask"` (default): the SVG is used as a CSS mask, and the
 *   layer is filled with `colorVar` — produces a single-color
 *   silhouette. Good for silhouette art (birds, trees, fg-shore).
 *   The SVG's own colors and tonal detail are *discarded*.
 *
 * - `"image"`: the SVG is rendered as a real image (`<img>`), so
 *   its own colors, gradients, and shading come through unchanged.
 *   `colorVar` is ignored. Good for color illustrations (lake,
 *   boat, dock).
 */
export type ParallaxLayerRenderMode = "mask" | "image"

/**
 * Per-breakpoint speed + amplitude for a sway animation. Speed and
 * skew are the parts that scale with stage size, so they live here.
 */
export type ParallaxLayerSwayBreakpointConfig = {
  /**
   * Peak `skewX` in degrees during the cycle. The *sign* matters:
   * adjacent tree layers should alternate signs so the field never
   * tips as one rigid block — at any instant, neighbours lean in
   * opposite directions.
   */
  skewDeg: number
  /** Full cycle duration in seconds. */
  durationSec: number
}

/**
 * Wind-sway animation applied to a mask-mode layer (typically
 * tree silhouettes). Driven entirely by a CSS keyframe animation,
 * so it runs off the scroll/parallax path and stays smooth even
 * when scrolling is idle.
 */
export type ParallaxLayerSway = {
  /**
   * Initial offset into the cycle, in seconds. Applied as a
   * negative `animation-delay` so each tree layer starts mid-
   * cycle and the field doesn't sway in unison.
   */
  phaseSec?: number
  /**
   * CSS `transform-origin` for the sway pivot. Defaults to
   * `"50% 100%"` (bottom-center) so a layer with its silhouette
   * pinned to the stage bottom bends at the trunks. For layers
   * whose tree mass sits higher in their SVG, set a pivot inside
   * the foliage (e.g. `"50% 67%"` for the closest band, `"50% 41%"`
   * for the furthest) so the motion looks rooted in the trunks
   * rather than at the silhouette's bounding-box edge.
   */
  origin?: string
  /**
   * Per-breakpoint speed + amplitude. All five breakpoints required —
   * same explicit-everywhere policy as the rest of the layer config.
   */
  breakpoints: Record<BreakpointKey, ParallaxLayerSwayBreakpointConfig>
}

export type ParallaxLayer = {
  /** Unique id (used as React key) */
  id: string
  /** Path to the SVG asset under /public */
  mask: string
  /**
   * How to render the SVG. Defaults to `"mask"` (silhouette tinted
   * by `colorVar`). Set to `"image"` for SVGs that have their own
   * colors / detail you want to preserve.
   */
  renderMode?: ParallaxLayerRenderMode
  /**
   * CSS custom property name that drives this layer's color, e.g.
   * `"--c-birds"`. Only used when `renderMode === "mask"`. Define
   * the variable in `src/styles/globals.css`.
   */
  colorVar?: string
  /**
   * Per-theme visibility. Set `{ day: true, night: false }` for
   * a layer that should only appear in day mode (like the sun),
   * or `{ day: false, night: true }` for night-only layers (moon,
   * stars). Omit entirely or set both to `true` for layers that
   * are always visible regardless of theme (trees, lake, etc.).
   *
   * The renderer maps this to a CSS variable (auto-generated from
   * the layer `id`) so the transition between 0 and 1 is smooth
   * via the existing `transition: opacity 600ms ease` on
   * `.parallax-layer`.
   */
  visibility?: { day: boolean; night: boolean }
  /**
   * Per-theme CSS `filter` strings for image-mode layers. Lets you
   * shift hue, brightness, saturation etc. without needing separate
   * SVGs per theme. Only applies when `renderMode === "image"`.
   *
   * Example: `{ day: "none", night: "brightness(0.4) saturate(0.6)" }`
   */
  filters?: { day: string; night: string }
  /** Optional z-index override (defaults to array order). */
  z?: number
  /**
   * SVG viewBox dimensions. Required if any breakpoint uses
   * `width` to constrain the layer — height is derived from
   * `naturalWidth / naturalHeight` (the aspect ratio). Omit if the
   * layer always fills the stage at every breakpoint.
   */
  naturalWidth?: number
  naturalHeight?: number
  /**
   * Optional wind-sway animation. Only applies to `renderMode:
   * "mask"` layers — the silhouette bends from its bottom edge
   * around a `transform-origin: 50% 100%` pivot. Combine across
   * the tree layers with staggered durations + phases to fake a
   * gust blowing through the scene.
   */
  sway?: ParallaxLayerSway
  /**
   * Per-breakpoint config. All five breakpoints are required —
   * there are no defaults at the layer level.
   */
  breakpoints: Record<BreakpointKey, ParallaxLayerBreakpointConfig>
}

export type ParallaxConfig = {
  /**
   * Total scrollable height of the parallax section in px, per
   * breakpoint. Fixed pixels make the scroll range deterministic
   * regardless of viewport height — no surprises on landscape
   * vs portrait orientations within the same width breakpoint.
   */
  sectionHeight: Record<BreakpointKey, number>
  /**
   * Stage configuration. The stage at each breakpoint is just a
   * `(stageWidth, stageHeight)` pixel rectangle — fully explicit,
   * no aspect-ratio coupling, no inherited defaults.
   */
  scene: {
    /**
     * Min-width thresholds in px for each breakpoint (mobile-first).
     * A viewport of width W resolves to the largest bp whose
     * threshold is `<= W`. `xs` should be `0`.
     */
    breakpoints: Record<BreakpointKey, number>
    /**
     * Fixed height in px for the sticky viewport window that crops
     * the stage. Using a fixed height instead of `100vh` ensures
     * devices with the same width breakpoint but different screen
     * heights (e.g. iPad Air vs iPad Pro) see the same vertical
     * slice of the scene.
     */
    viewportHeight: Record<BreakpointKey, number>
    /** Stage width in px at each breakpoint. */
    stageWidth: Record<BreakpointKey, number>
    /** Stage height in px at each breakpoint. */
    stageHeight: Record<BreakpointKey, number>
  }
  /** Sky gradient stops */
  sky: { top: string; mid: string; bot: string }
  /** Hero logo overlay */
  hero: {
    /** Logo SVG paths per theme */
    logo: { day: string; night: string }
    /** p value where the hero starts fading out */
    fadeStart: number
    /** Multiplier on fade speed */
    fadeSpeed: number
    /** Distance hero rises (in px) across the whole scroll */
    riseDistancePx: number
    /** Logo width as % of viewport width, per breakpoint */
    width: Record<BreakpointKey, number>
  }
  /** Layers from back to front */
  layers: ParallaxLayer[]
}

export const parallaxConfig: ParallaxConfig = {
  sectionHeight: {
    xs: 2100,
    sm: 1300,
    md: 2900,
    lg: 2000,
    xl: 2200,
  },
  scene: {
    // Min-width thresholds (mobile-first). xs must be 0.
    breakpoints: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1280,
      xl: 1920,
    },
    // Fixed viewport window height in px per breakpoint.
    viewportHeight: {
      xs: 1000,
      sm: 1300,
      md: 1624,
      lg: 1400,
      xl: 1400,
    },
    // Stage width in px at each breakpoint.
    stageWidth: {
      xs: 560,
      sm: 820,
      md: 1600,
      lg: 2600,
      xl: 3000,
    },
    // Stage height in px at each breakpoint. Defaults below mirror
    // the source SVG aspect (7051.72 / 6983.26 ≈ 1.0098), but feel
    // free to set freely — height is not constrained to width.
    stageHeight: {
      xs: 555,
      sm: 912,
      md: 1700,
      lg: 1981,
      xl: 2600,
    },
  },
  sky: {
    top: "var(--sky-top)",
    mid: "var(--sky-mid)",
    bot: "var(--sky-bot)",
  },
  hero: {
    logo: {
      day: "/assets/db-logo-with-bg.svg",
      night: "/assets/db-logo-night.svg",
    },
    fadeStart: 0.05,
    fadeSpeed: 1.25,
    riseDistancePx: 40,
    width: {
      xs: 170,
      sm: 85,
      md: 90,
      lg: 80,
      xl: 55,
    },
  },
  layers: [
    // ----- Sky layers (back of scene) ---------------------------
    // Stars are rendered procedurally by `<StarField>` (see
    // `modules/home/components/parallax/star-field.tsx`), not as an SVG layer.
    // They cover the full sky and twinkle independently.
    //
    // Moon: visible only at night via --moon-opacity. Co-located
    // with the sun so the day/night swap feels like one celestial
    // body transforming.
    {
      id: "moon",
      mask: "/assets/moon.svg",
      renderMode: "image",
      visibility: { day: false, night: true },
      naturalWidth: 400,
      naturalHeight: 400,
      breakpoints: {
        xs: { start: 5, travel: -1, width: 28, x: 18 },
        sm: { start: 8, travel: -1, startX: 1, travelX: 10, width: 23, x: 10 },
        md: { start: 76, travel: -45, startX: 1, travelX: 5, width: 28, x: 5 },
        lg: { start: 20, travel: -5, startX: 1, travelX: 4, width: 10, x: 4 },
        xl: { start: 18, travel: -5, startX: 1, travelX: 4, width: 9, x: 4 },
      },
    },
    // Sun: visible only at day via --sun-opacity. Same geometry as
    // the moon — they cross-fade in place during theme switch.
    {
      id: "sun",
      mask: "/assets/sun.svg",
      renderMode: "image",
      visibility: { day: true, night: false },
      naturalWidth: 400,
      naturalHeight: 400,
      breakpoints: {
        xs: { start: 5, travel: -1, width: 28, x: 18 },
        sm: { start: 8, travel: -2, startX: 1, travelX: 20, width: 23, x: 10 },
        md: { start: 76, travel: -45, startX: 1, travelX: 5, width: 28, x: 5 },
        lg: { start: 20, travel: -6, startX: 1, travelX: 4, width: 10, x: 4 },
        xl: { start: 18, travel: -5, startX: 1, travelX: 4, width: 9, x: 4 },
      },
    },
    // ----- Scene silhouettes (back → front) ---------------------
    {
      id: "bg-trees-4",
      mask: "/assets/bg-trees-4.svg",
      colorVar: "--c-bg-trees-4",
      sway: {
        phaseSec: 0,
        origin: "50% 41%",
        breakpoints: {
          xs: { skewDeg: 0.81, durationSec: 9.5 },
          sm: { skewDeg: 0.9, durationSec: 9.5 },
          md: { skewDeg: 0.99, durationSec: 9.0 },
          lg: { skewDeg: 1.17, durationSec: 8.5 },
          xl: { skewDeg: 1.26, durationSec: 8.5 },
        },
      },
      breakpoints: {
        xs: { start: 50, travel: -6, maskPosition: "50% 94%" },
        sm: { start: 40, travel: -9, maskPosition: "50% 94%" },
        md: { start: 50, travel: -28, maskPosition: "50% 94%" },
        lg: { start: 50, travel: -35, maskPosition: "50% 94%" },
        xl: { start: 45, travel: -32, maskPosition: "50% 94%" },
      },
    },
    {
      id: "bg-trees-3",
      mask: "/assets/bg-trees-3.svg",
      colorVar: "--c-bg-trees-3",
      // Negative skew: leans opposite to bg-trees-4 at the same instant.
      sway: {
        phaseSec: -2.1,
        origin: "50% 48%",
        breakpoints: {
          xs: { skewDeg: -1.08, durationSec: 8.5 },
          sm: { skewDeg: -1.17, durationSec: 8.5 },
          md: { skewDeg: -1.26, durationSec: 8.0 },
          lg: { skewDeg: -1.44, durationSec: 7.5 },
          xl: { skewDeg: -1.53, durationSec: 7.5 },
        },
      },
      breakpoints: {
        xs: { start: 50, travel: -6, maskPosition: "50% 95%" },
        sm: { start: 40, travel: -10, maskPosition: "50% 95%" },
        md: { start: 50, travel: -30, maskPosition: "50% 95%" },
        lg: { start: 50, travel: -38, maskPosition: "50% 95%" },
        xl: { start: 42, travel: -35, maskPosition: "50% 95%" },
      },
    },
    {
      id: "birds",
      mask: "/assets/birds.svg",
      colorVar: "--c-birds",
      // SVG viewBox: 4741.31 × 407.83 (wide thin strip)
      visibility: { day: true, night: false },
      naturalWidth: 4741.31,
      naturalHeight: 407.83,
      breakpoints: {
        xs: {
          start: 60,
          travel: -20,
          startX: -4,
          travelX: 7,
          width: 100,
          x: 0,
        },
        sm: { start: 10, travel: 2, startX: -5, travelX: 10, width: 100, x: 0 },
        md: {
          start: 84,
          travel: -60,
          startX: -5,
          travelX: 10,
          width: 80,
          x: 0,
        },
        lg: { start: 38, travel: 6, startX: -4, travelX: 8, width: 64, x: 0 },
        xl: { start: 35, travel: 5, startX: -4, travelX: 7, width: 59, x: 0 },
      },
    },
    {
      id: "bg-trees-2",
      mask: "/assets/bg-trees-2.svg",
      colorVar: "--c-bg-trees-2",
      // Positive skew: leans opposite to bg-trees-1 / bg-trees-3.
      sway: {
        phaseSec: -4.4,
        origin: "50% 55%",
        breakpoints: {
          xs: { skewDeg: 1.82, durationSec: 7.2 },
          sm: { skewDeg: 1.94, durationSec: 7.2 },
          md: { skewDeg: 2.06, durationSec: 6.8 },
          lg: { skewDeg: 2.3, durationSec: 6.4 },
          xl: { skewDeg: 2.42, durationSec: 6.4 },
        },
      },
      breakpoints: {
        xs: { start: 50, travel: -7, maskPosition: "50% 96%" },
        sm: { start: 42, travel: -12, maskPosition: "50% 96%" },
        md: { start: 52, travel: -32, maskPosition: "50% 96%" },
        lg: { start: 56, travel: -46, maskPosition: "50% 96%" },
        xl: { start: 46, travel: -42, maskPosition: "50% 96%" },
      },
    },
    {
      id: "bg-trees-1",
      mask: "/assets/bg-trees-1.svg",
      colorVar: "--c-bg-trees-1",
      // Negative skew + lowest pivot: closest band, biggest motion.
      sway: {
        phaseSec: -1.3,
        origin: "50% 67%",
        breakpoints: {
          xs: { skewDeg: -2.38, durationSec: 6.4 },
          sm: { skewDeg: -2.51, durationSec: 6.4 },
          md: { skewDeg: -2.77, durationSec: 6.0 },
          lg: { skewDeg: -3.04, durationSec: 5.6 },
          xl: { skewDeg: -3.3, durationSec: 5.6 },
        },
      },
      breakpoints: {
        xs: { start: 50, travel: -9, maskPosition: "50% 97%" },
        sm: { start: 40, travel: -14, maskPosition: "50% 97%" },
        md: { start: 54, travel: -42, maskPosition: "50% 97%" },
        lg: { start: 56, travel: -53, maskPosition: "50% 97%" },
        xl: { start: 44, travel: -48, maskPosition: "50% 97%" },
      },
    },
    {
      id: "lake",
      mask: "/assets/lake.svg",
      renderMode: "image",
      filters: {
        day: "saturate(1.1) hue-rotate(-15deg) brightness(0.95)",
        night: "brightness(0.3) saturate(0.5) hue-rotate(10deg)",
      },
      breakpoints: {
        xs: { start: 60, travel: -19 },
        sm: { start: 40, travel: -15 },
        md: { start: 60, travel: -45 },
        lg: { start: 56, travel: -50 },
        xl: { start: 46, travel: -48 },
      },
    },
    {
      id: "boat",
      mask: "/assets/boat.svg",
      renderMode: "image",
      filters: {
        day: "none",
        night: "brightness(0.35) saturate(0.5)",
      },
      // SVG viewBox: 696.64 × 259.9  (small object, ~2.68:1)
      naturalWidth: 696.64,
      naturalHeight: 259.9,
      breakpoints: {
        xs: {
          start: 120,
          travel: -18,
          startX: 1,
          travelX: -1,
          width: 20,
          x: -22,
        },
        sm: {
          start: 105,
          travel: -19,
          startX: 1,
          travelX: -2,
          width: 16,
          x: -22,
        },
        md: {
          start: 130,
          travel: -53,
          startX: 1,
          travelX: -2,
          width: 8,
          x: -22,
        },
        lg: {
          start: 132,
          travel: -64,
          startX: 1,
          travelX: -2,
          width: 6,
          x: -18,
        },
        xl: {
          start: 120,
          travel: -59,
          startX: 1,
          travelX: -2,
          width: 6,
          x: -17,
        },
      },
    },
    {
      id: "dock",
      mask: "/assets/dock.svg",
      renderMode: "image",
      filters: {
        day: "none",
        night: "brightness(0.3) saturate(0.4)",
      },
      // SVG viewBox: 1638.48 × 996.04  (~1.64:1)
      naturalWidth: 1638.48,
      naturalHeight: 996.04,
      breakpoints: {
        xs: { start: 150, travel: -30, width: 32, x: 0 },
        sm: { start: 130, travel: -30, width: 36, x: 0 },
        md: { start: 155, travel: -70, width: 24, x: 0 },
        lg: { start: 180, travel: -104, width: 10, x: 0 },
        xl: { start: 160, travel: -93, width: 12, x: 0 },
      },
    },
    {
      id: "fg-shore",
      mask: "/assets/fg-shore.svg",
      colorVar: "--c-fg-shore",
      breakpoints: {
        xs: { start: 70, travel: -30 },
        sm: { start: 92, travel: -66 },
        md: { start: 150, travel: -148 },
        lg: { start: 150, travel: -164 },
        xl: { start: 130, travel: -153 },
      },
    },
  ],
}
