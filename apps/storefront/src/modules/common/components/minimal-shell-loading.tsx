export function MinimalShellLoading({ label = "Loading" }: { label?: string }) {
  return (
    <main className="shop shop-checkout" data-screen-label={label}>
      <div className="crumb">
        <span className="now">{label}…</span>
      </div>
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "48px var(--pad) 120px",
          textAlign: "center",
          color: "var(--ink-soft)",
          fontSize: 12,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        — {label} —
      </div>
    </main>
  )
}
