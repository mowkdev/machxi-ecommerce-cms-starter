export const canUseDOM: boolean = Boolean(
  typeof window !== "undefined" && window.document && window.document.createElement,
)
