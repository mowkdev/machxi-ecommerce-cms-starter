# Dabasberns

Handmade rods & gear for cold, quiet lakes — a Next.js 15 (App Router) port of
the static `design/` wireframe, with a config-driven, framer-motion parallax
hero.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS** for styling
- **framer-motion** for scroll-driven parallax
- **shadcn/ui** primitives (`Button`) on top of Radix + class-variance-authority
- **lucide-react** for icons

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Project layout

```
app/
  layout.tsx           # Root layout, fonts, metadata
  page.tsx             # Homepage
  globals.css          # Design tokens + parallax-layer base styles
components/
  header.tsx           # Sticky nav, becomes glassy after hero
  footer.tsx           # Footer with newsletter form
  parallax-hero.tsx    # Scroll-driven parallax (framer-motion)
  featured-products.tsx
  story.tsx
  ui/button.tsx        # shadcn-style button
config/
  site.ts              # Site name, nav, footer, hero copy
  parallax.ts          # Parallax scene config (layers, speeds, offsets)
  products.ts          # Featured products
public/assets/         # SVG mask layers + logo
```

## Tweaking the parallax

All scene knobs live in [`config/parallax.ts`](./config/parallax.ts).

Each layer is described by:

```ts
{
  id: "bg-trees-1",
  mask: "/assets/bg-trees-1.svg",   // SVG used as a CSS mask
  colorVar: "--c-bg-trees-1",       // CSS var that colors the silhouette
  start: 5,                          // initial Y offset, in vh
  travel: -15,                       // distance Y moves as the user scrolls
                                     // the section (p: 0 -> 1), in vh
  maskPosition: "50% 97%",          // optional mask anchoring
}
```

The translation each frame is:

```
translateY = `${start}vh` + p * `${travel}vh`
```

Layers earlier in the array sit further back; later ones are closer to the
camera. Larger `|travel|` values = faster perceived motion. The section's
total scroll height is set via `sectionVh` (default `220`) — increase it to
slow the whole sequence down.

Other tunables in the same file:

- `sky.top / mid / bot` — sky gradient stops (CSS values or vars)
- `celestial` — sun/moon position, travel, and fade-out timing
- `stars` — vertical drift speed (visibility is controlled by `--stars-opacity`)
- `hero` — fade start, fade speed, and rise distance for the headline

## Design tokens

Colors and typography live as CSS custom properties in
[`app/globals.css`](./app/globals.css). Day-palette defaults are defined on
`:root`; swap them in JS if you want to introduce a night mode. The current
build ships with the day palette only.

## Notes

- All nav and footer links are static (`href="#"`) — wire them up when real
  routes exist.
- The newsletter form is local-state only; no backend.
- Product cards use placeholder hatched art (no real imagery yet).
