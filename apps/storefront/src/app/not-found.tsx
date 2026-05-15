import Link from "next/link"

export default function NotFound() {
  return (
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
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "var(--ink-soft)",
        }}
      >
        404
      </span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(40px, 5vw, 64px)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          margin: 0,
          fontWeight: 400,
        }}
      >
        Page not found
      </h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "40ch" }}>
        The page you were looking for isn&apos;t here.{" "}
        <Link
          href="/"
          style={{
            color: "var(--ink)",
            borderBottom: "1px solid currentColor",
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
        .
      </p>
    </main>
  )
}
