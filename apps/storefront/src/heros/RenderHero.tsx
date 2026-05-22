import type { HeroProps } from "./types"
import { HighImpactHero } from "./HighImpactHero"
import { LowImpactHero } from "./LowImpactHero"
import { MediumImpactHero } from "./MediumImpactHero"

const heroes = {
  highImpact: HighImpactHero,
  mediumImpact: MediumImpactHero,
  lowImpact: LowImpactHero,
} as const

export function RenderHero(props: HeroProps) {
  const { type } = props
  if (!type || type === "none") return null
  const HeroToRender = heroes[type]
  if (!HeroToRender) return null
  return <HeroToRender {...props} />
}
