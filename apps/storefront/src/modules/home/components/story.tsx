export function Story() {
  return (
    <section data-screen-label="Story" className="bg-paper pt-[60px] pb-[90px]">
      <div className="container-padded grid items-center gap-10 md:gap-16 grid-cols-1 md:grid-cols-2">
        <div>
          <span className="text-[12px] tracking-[0.32em] uppercase text-[var(--accent-deep)]">
            A small workshop
          </span>
          <h3
            className="font-display font-normal uppercase mt-3 mb-5 leading-[1.25]"
            style={{
              fontSize: "clamp(24px, 2.6vw, 32px)",
              letterSpacing: "0.02em",
            }}
          >
            Built one at a time, on a long bench by a lake that freezes in
            February.
          </h3>
          <p className="text-[16px] leading-[1.65] text-ink-soft m-0 mb-3.5 max-w-[46ch]">
            We make a handful of rods each season — split-cane, fiberglass, the
            occasional graphite blank — and a few small things to go with them.
            Lines, flies, a wool cap for the cold mornings.
          </p>
          <p className="text-[16px] leading-[1.65] text-ink-soft m-0 mb-3.5 max-w-[46ch]">
            Everything is tested locally before it ships. If it doesn&apos;t
            catch fish, it doesn&apos;t leave the bench.
          </p>
          <div className="mt-7 italic text-[16px] text-ink-soft">
            — Jānis &amp; Anete
          </div>
        </div>
        <div
          className="aspect-[4/5] rounded-md relative overflow-hidden"
          style={{
            background: `repeating-linear-gradient(135deg, color-mix(in srgb, var(--ink) 6%, transparent) 0 10px, transparent 10px 20px), linear-gradient(135deg, var(--paper-3), color-mix(in srgb, var(--ink) 30%, var(--paper-3)))`,
          }}
        >
          <span
            className="absolute bottom-4 left-4 font-mono text-[11px] tracking-[0.16em]"
            style={{
              color: "color-mix(in srgb, var(--ink) 55%, transparent)",
            }}
          >
            WORKSHOP / KURZEME
          </span>
        </div>
      </div>
    </section>
  )
}
