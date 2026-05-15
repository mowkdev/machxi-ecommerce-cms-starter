export const THEME_STORAGE_KEY = "dabasberns:theme"
export const DEFAULT_THEME = "day"

/**
 * Tiny script intended to run **before** React hydrates, inside the document
 * <head>. It reads the stored theme from localStorage and writes `data-theme`
 * on <html> synchronously, eliminating the flash of incorrect theme on
 * initial load. Inlined as a string into a `<script>` tag in `src/app/layout.tsx`.
 *
 * Kept in a non-"use client" module so the root layout can import it without
 * dragging in the rest of the theme provider (which calls `createContext` at
 * module load and crashes Next.js's auto-generated /_error prerender).
 */
export const themeNoFlashScript = `
(function() {
  try {
    var k = '${THEME_STORAGE_KEY}';
    var stored = window.localStorage.getItem(k);
    var theme = (stored === 'night' || stored === 'day') ? stored : '${DEFAULT_THEME}';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}');
  }
})();
`.trim()
