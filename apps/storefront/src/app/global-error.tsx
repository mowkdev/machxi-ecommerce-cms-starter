"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            gap: 16,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
            color: "#1a1a1a",
            background: "#fff",
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            500
          </span>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin: 0,
              fontWeight: 400,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ opacity: 0.7, maxWidth: "40ch" }}>
            We&apos;ve been notified. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              fontSize: 13,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              border: "1px solid currentColor",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
