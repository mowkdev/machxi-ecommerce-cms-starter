"use client"

import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react"
import type { SerializedEditorState } from "lexical"

type Props = {
  data?: { root: { children: unknown[] } & Record<string, unknown> } | null
  fallback?: string | null
  className?: string
}

export function PayloadRichText({ data, fallback, className }: Props) {
  if (data && typeof data === "object") {
    return <LexicalRichText data={data as unknown as SerializedEditorState} className={className} />
  }
  if (fallback) {
    return <p className={className}>{fallback}</p>
  }
  return null
}
