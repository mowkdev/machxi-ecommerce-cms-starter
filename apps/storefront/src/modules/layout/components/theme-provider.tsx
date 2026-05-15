"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

/**
 * Theme system
 * --------------------------------------------------------------
 * Two themes: `"day"` (default) and `"night"`. The active theme
 * is stored on the `<html>` element as `data-theme="day|night"`,
 * which `src/styles/globals.css` reads to swap the entire palette in
 * one attribute change.
 *
 * Persistence: localStorage under `THEME_STORAGE_KEY`.
 *
 * Hydration: SSR always renders with `"day"` (the CSS default).
 * A small inline script in `src/app/layout.tsx` runs before paint
 * and patches `data-theme` from localStorage, preventing FOUC.
 * The provider then picks up that value on mount.
 */
export type Theme = "day" | "night"

import {
  DEFAULT_THEME as DEFAULT_THEME_RAW,
  THEME_STORAGE_KEY,
} from "@/modules/layout/components/theme-no-flash-script"

const DEFAULT_THEME = DEFAULT_THEME_RAW as Theme

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === "night" || stored === "day" ? stored : DEFAULT_THEME
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with the default so SSR and the first client render
  // match. The effect below corrects from localStorage / the DOM.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    // The no-flash script in <html> may have already set
    // data-theme. Prefer that, fall back to localStorage.
    const fromDom = document.documentElement.dataset.theme as Theme | undefined
    const initial =
      fromDom === "night" || fromDom === "day" ? fromDom : readStoredTheme()
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // localStorage can throw in private mode / disabled storage
      // — non-fatal, the theme still applies in-memory.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "day" ? "night" : "day")
  }, [setTheme, theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>")
  }
  return ctx
}

// `themeNoFlashScript` is exported from `modules/layout/components/theme-no-flash-script.ts`
// so the root layout can import it without dragging in this client-only
// module (whose top-level `createContext` call would break Next.js's
// auto-generated /_error prerender).
