"use client"

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion"
import { useLenis } from "lenis/react"
import { useMemo, useRef } from "react"

import { DevBreakpointOverlay } from "@/modules/home/components/parallax/dev-overlay"
import {
  useBreakpoint,
  useImagesReady,
} from "@/modules/home/components/parallax/hooks"
import { DustField } from "@/modules/home/components/parallax/dust-field"
import { SceneLayer } from "@/modules/home/components/parallax/scene-layer"
import { ScrollCue } from "@/modules/home/components/parallax/scroll-cue"
import { StarField } from "@/modules/home/components/parallax/star-field"
import { useTheme } from "@/modules/layout/components/theme-provider"
import { parallaxConfig } from "@/config/parallax"
import { siteConfig } from "@/config/site"

const { sectionHeight, scene, sky, hero, layers } = parallaxConfig

/** Every image URL the scene needs preloaded (layers + both logos). */
const IMAGE_SRCS: readonly string[] = [
  hero.logo.day,
  hero.logo.night,
  ...layers
    .filter((l) => (l.renderMode ?? "mask") === "image")
    .map((l) => l.mask),
]

/** Sky gradient is fully static (vars don't change at runtime). */
const SKY_GRADIENT_TOP = `linear-gradient(to bottom, ${sky.top} 0%, ${sky.mid} 55%, ${sky.bot} 100%)`
const SKY_GRADIENT_INNER = `linear-gradient(to bottom, ${sky.top} 0%, ${sky.mid} 50%, ${sky.bot} 80%, ${sky.bot} 100%)`

const LENIS_SCROLL_DURATION = 4.5

export function ParallaxHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const { theme } = useTheme()
  const lenis = useLenis()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const [bp, bpHydrated, vpWidth] = useBreakpoint(scene.breakpoints)
  const stageW = scene.stageWidth[bp]
  const stageH = scene.stageHeight[bp]
  const vpH = scene.viewportHeight[bp]
  const sectionH = sectionHeight[bp]

  const imagesReady = useImagesReady(IMAGE_SRCS)
  const sceneReady = bpHydrated && imagesReady

  const heroOpacity = useTransform(scrollYProgress, (p) =>
    Math.max(0, 1 - Math.max(0, p - hero.fadeStart) * hero.fadeSpeed)
  )
  const heroRiseY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -hero.riseDistancePx]
  )
  const scrollCueOpacity = useTransform(scrollYProgress, (p) =>
    Math.max(0, 0.7 - p * 1.5)
  )

  const logoSrc = theme === "night" ? hero.logo.night : hero.logo.day

  const stageStyle = useMemo(
    () =>
      ({
        "--stage-w": `${stageW}px`,
        "--stage-h": `${stageH}px`,
      }) as React.CSSProperties,
    [stageW, stageH]
  )

  const handleScrollDown = () => {
    const section = sectionRef.current
    const next = section?.nextElementSibling as HTMLElement | null
    if (!next) return
    if (lenis) {
      lenis.scrollTo(next, { duration: LENIS_SCROLL_DURATION })
    } else {
      next.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <DevBreakpointOverlay bp={bp} width={vpWidth} />
      )}
      <section
        ref={sectionRef}
        id="parallax-section"
        data-screen-label="Hero parallax"
        className="relative"
        style={{ height: `${sectionH}px`, background: SKY_GRADIENT_TOP }}
      >
        <div
          className="sticky top-0 overflow-hidden"
          style={{ height: vpH, background: SKY_GRADIENT_INNER }}
        >
          {/* Loading spinner */}
          <AnimatePresence>
            {!sceneReady && (
              <motion.div
                key="scene-loader"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 z-[9998] flex items-center justify-center pointer-events-none"
              >
                <div className="scene-spinner" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parallax scene layers — fades in once loaded */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneReady ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Procedural starfield — back of sky, night only */}
            <StarField
              progress={scrollYProgress}
              visible={theme === "night"}
              driftDistancePx={stageH * 0.05}
            />

            {/* Atmospheric dust motes — air depth, day only */}
            <DustField
              progress={scrollYProgress}
              visible={theme === "day"}
              driftDistancePx={stageH * -0.04}
            />

            <div className="parallax-stage" style={stageStyle}>
              {layers.map((layer, i) => (
                <SceneLayer
                  key={layer.id}
                  layer={layer}
                  progress={scrollYProgress}
                  z={layer.z ?? i + 1}
                  bp={bp}
                  stageW={stageW}
                  stageH={stageH}
                  theme={theme}
                />
              ))}
            </div>

            {/* Foreground vignette */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 130% 100% at 50% 55%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.32) 100%)",
                zIndex: layers.length + 1,
              }}
            />
          </motion.div>

          {/* Hero layer — viewport-sized overlay for logo + scroll cue */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{ height: "100vh", zIndex: layers.length + 2 }}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: heroOpacity }}
            >
              <motion.div style={{ y: heroRiseY }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo with viewport-relative sizing; next/image adds no value for vector assets */}
                <img
                  src={logoSrc}
                  alt={siteConfig.name}
                  draggable={false}
                  className="hero-logo"
                  style={{
                    width: `${hero.width[bp]}vw`,
                    height: "auto",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              </motion.div>
            </motion.div>

            <ScrollCue opacity={scrollCueOpacity} onScroll={handleScrollDown} />
          </div>
        </div>
      </section>
    </>
  )
}
