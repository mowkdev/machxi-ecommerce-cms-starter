"use client"

import { RefreshRouteOnSave as PayloadLivePreview } from "@payloadcms/live-preview-react"
import { useRouter } from "next/navigation"

import { getClientSideURL } from "@/utilities/getURL"

export function LivePreviewListener() {
  const router = useRouter()
  return <PayloadLivePreview refresh={router.refresh} serverURL={getClientSideURL()} />
}
