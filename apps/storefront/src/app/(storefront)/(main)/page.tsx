import { Creator } from "@/modules/home/components/creator"
import { ParallaxHero } from "@/modules/home/components/parallax-hero"
import { ShopCta } from "@/modules/home/components/shop-cta"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  return (
    <main>
      <ParallaxHero />

      <Creator
        video={{
          youtubeId: "dQw4w9WgXcQ",
          title: "A Saturday on Lake Engure — wrapping a 5wt at dawn",
        }}
        author={{
          eyebrow: "The man at the bench",
          headlinePrefix: "Hi, I'm ",
          headlineAccent: "Jānis.",
          paragraphs: [
            "I've been wrapping rods on a long bench in Kuldīga since 2014. Most weeks I'm on the lake before sunrise with a camera, then back in the workshop by noon tying flies, oiling cork, and posting bits of it for anyone who wants to watch.",
            "This is where the things I make end up. A small shelf. Built quietly, one at a time.",
          ],
          signName: "Jānis Bērziņš",
          signRole: "Maker · Kuldīga",
        }}
        socials={{
          eyebrow: "Follow along",
          heading: "Find me online.",
          total: { value: "265k", label: "across all platforms" },
          accounts: [
            {
              platform: "youtube",
              url: "https://youtube.com/@dabasberns",
              handle: "@dabasberns",
              count: "187k",
            },
            {
              platform: "instagram",
              url: "https://instagram.com/dabasberns",
              handle: "@dabasberns",
              count: "42k",
            },
            {
              platform: "instagram",
              url: "https://instagram.com/janis.berzins",
              handle: "@janis.berzins",
              count: "8.2k",
            },
            {
              platform: "tiktok",
              url: "https://tiktok.com/@dabasberns",
              handle: "@dabasberns",
              count: "28k",
            },
          ],
        }}
      />

      <ShopCta
        eyebrow="From the shelf"
        headlinePrefix="The things I "
        headlineAccent="make"
        headlineSuffix=", for sale."
        paragraphs={[
          "A small, slow shop. Rods, lines, a few flies I tied last Sunday. Most weeks there are only a dozen items on the shelf — when something sells out, it's gone until the next batch.",
          "Everything ships from Kuldīga on Tuesdays.",
        ]}
        ctaLabel="Browse the shop"
        ctaHref="/products"
        stamp={{ line1: "Hand", line2: "built", small: "№ 24" }}
        stats={[
          { value: "12", label: "on the shelf" },
          { value: "Tue", label: "next shipping day" },
        ]}
        images={[
          { captionLeft: "Rod · 03", captionRight: "Saulrieta" },
          { captionLeft: "Bench", captionRight: "Apr / 26" },
          { captionLeft: "Fly · 04", captionRight: "#14" },
        ]}
      />
    </main>
  )
}
