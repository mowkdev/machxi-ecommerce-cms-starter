"use client"

import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react"
import type { SerializedEditorState } from "lexical"

type Props = {
  data?: SerializedEditorState | null
  fallback?: string | null
  className?: string
}

export function PayloadRichText({ data, fallback, className }: Props) {
  if (data && typeof data === "object") {
    return <LexicalRichText data={data} className={className} />
  }
  if (fallback) {
    return <p className={className}>{fallback}</p>
  }
  return null
}
