"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

type ToastVariant = "info" | "success" | "error"

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastApi = {
  toast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      setToasts((prev) => [...prev, { id, message, variant }])
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      timersRef.current.set(id, timer)
    },
    [dismiss]
  )

  const value = useMemo<ToastApi>(
    () => ({
      toast,
      success: (m) => toast(m, "success"),
      error: (m) => toast(m, "error"),
    }),
    [toast]
  )

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: "fixed",
              right: 16,
              bottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 200,
              maxWidth: "calc(100vw - 32px)",
            }}
          >
            {toasts.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => dismiss(t.id)}
                style={{
                  background: "var(--paper)",
                  color: "var(--ink)",
                  border: `1px solid ${variantBorder(t.variant)}`,
                  borderLeft: `3px solid ${variantAccent(t.variant)}`,
                  borderRadius: 6,
                  padding: "12px 16px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: "0 6px 24px rgba(12, 26, 38, 0.08)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  minWidth: 240,
                  maxWidth: 360,
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: variantAccent(t.variant),
                    marginBottom: 4,
                  }}
                >
                  {variantLabel(t.variant)}
                </span>
                {t.message}
              </button>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>")
  }
  return ctx
}

function variantBorder(v: ToastVariant) {
  return "color-mix(in srgb, var(--ink) 12%, transparent)"
}

function variantAccent(v: ToastVariant) {
  if (v === "success") return "var(--accent-deep)"
  if (v === "error") return "#a8423a"
  return "var(--ink)"
}

function variantLabel(v: ToastVariant) {
  if (v === "success") return "Done"
  if (v === "error") return "Something's off"
  return "Note"
}
