import type { Page } from "@/payload-types"

export type HeroProps = NonNullable<Page["hero"]>
export type HeroLink = NonNullable<HeroProps["links"]>[number]
