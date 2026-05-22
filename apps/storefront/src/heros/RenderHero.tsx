import type { HeroProps } from "./types"
import { HighImpactHero } from "./HighImpactHero"
import { LowImpactHero } from "./LowImpactHero"
import { MediumImpactHero } from "./MediumImpactHero"
import { ParallaxHero } from "@/modules/home/components/parallax-hero"

const heroes = {
  highImpact: HighImpactHero,
  mediumImpact: MediumImpactHero,
  lowImpact: LowImpactHero,
} as const

export function RenderHero(props: HeroProps) {
  const { type } = props
  if (!type || type === "none") return null
  if (type === "parallax") return <ParallaxHero />
  const HeroToRender = heroes[type as keyof typeof heroes]
  if (!HeroToRender) return null
  return <HeroToRender {...props} />
}
