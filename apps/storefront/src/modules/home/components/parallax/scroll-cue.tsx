"use client"

import { motion, type MotionValue } from "framer-motion"

type ScrollCueProps = {
  opacity: MotionValue<number>
  onScroll: () => void
}

/**
 * Animated scroll-down button. Sits at the bottom-center of its
 * containing element. Opacity is driven by a MotionValue (typically
 * scroll progress) so it fades as the user scrolls into the scene.
 */
export function ScrollCue({ opacity, onScroll }: ScrollCueProps) {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ color: "var(--on-sky-fg)", opacity }}
    >
      <button
        type="button"
        onClick={onScroll}
        className="flex flex-col items-center gap-3 bg-transparent border-0 p-0 cursor-pointer pointer-events-auto animate-scroll-bounce"
        style={{ color: "inherit", font: "inherit" }}
        aria-label="Scroll down"
      >
        <span className="text-[13px] font-light tracking-[0.35em] uppercase">
          Explore
        </span>
        <span className="block w-px h-12 bg-current opacity-60 origin-top animate-scroll-cue" />
        <svg
          width="16"
          height="10"
          viewBox="0 0 16 10"
          fill="none"
          className="opacity-80 -mt-1"
        >
          <path
            d="M1 1l7 7 7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.div>
  )
}
