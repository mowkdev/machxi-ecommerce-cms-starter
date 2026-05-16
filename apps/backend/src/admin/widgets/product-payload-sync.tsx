import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type ConfigResponse = { serverUrl: string; userCollection: string }

type ProductWithLink = HttpTypes.AdminProduct & {
  metadata?: {
    payload_synced_at?: string | null
    payload_sync_status?: "success" | "failed"
    payload_sync_error?: string | null
  } | null
  payload_product?: { id: string } | null
}

type ProductResponse = { product: ProductWithLink }

type ResyncResponse = {
  ok: boolean
  product_id: string
  status: "success" | "failed"
  error: string | null
}

const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, { credentials: "include", ...init })
  if (!res.ok) {
    let body: { message?: string; error?: string } | undefined
    try {
      body = await res.json()
    } catch {
      // ignore parse error
    }
    throw new Error(body?.error ?? body?.message ?? `Request to ${url} failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

const formatRelative = (iso: string | null | undefined): string | null => {
  if (!iso) return null
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return null
  const diffSec = (ms - Date.now()) / 1000
  const abs = Math.abs(diffSec)
  if (abs < 60) return RELATIVE_TIME.format(Math.round(diffSec), "second")
  if (abs < 3600) return RELATIVE_TIME.format(Math.round(diffSec / 60), "minute")
  if (abs < 86400) return RELATIVE_TIME.format(Math.round(diffSec / 3600), "hour")
  return RELATIVE_TIME.format(Math.round(diffSec / 86400), "day")
}

const PayloadSyncWidget = ({ data: product }: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()

  // Display query 1: link + metadata. Loads on mount (per data-display-on-mount rule).
  const { data: productData, isLoading: productLoading } = useQuery<ProductResponse>({
    queryKey: ["payload-sync-product", product.id],
    queryFn: () =>
      fetchJson<ProductResponse>(
        `/admin/products/${product.id}?fields=%2Bpayload_product.*,metadata`
      ),
  })

  // Display query 2: shared with settings page — Payload server URL for the external link.
  const { data: cfg } = useQuery<ConfigResponse>({
    queryKey: ["payload-config"],
    queryFn: () => fetchJson<ConfigResponse>("/admin/payload/config"),
  })

  const resync = useMutation<ResyncResponse>({
    mutationFn: () =>
      fetchJson<ResyncResponse>(`/admin/payload/sync/products/${product.id}`, { method: "POST" }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Synced to Payload")
      } else {
        toast.error(result.error ?? "Sync failed")
      }
      queryClient.invalidateQueries({ queryKey: ["payload-sync-product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["payload-sync-stats"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const enriched = productData?.product
  const meta = enriched?.metadata ?? {}
  const payloadLink = enriched?.payload_product ?? null
  const status = meta.payload_sync_status
  const isSynced = Boolean(payloadLink)
  const isFailed = status === "failed"
  const lastSyncedRel = formatRelative(meta.payload_synced_at)
  const payloadAdminUrl =
    cfg?.serverUrl && payloadLink
      ? `${cfg.serverUrl.replace(/\/$/, "")}/admin/collections/products/${payloadLink.id}`
      : null

  return (
    <Container className="divide-y divide-ui-border-base">
      <div className="px-6 py-4">
        <Heading level="h2" className="text-base">
          Payload sync
        </Heading>
      </div>

      <div className="px-6 py-4">
        {productLoading ? (
          <Text size="small" className="text-ui-fg-subtle">
            Loading sync status…
          </Text>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {isFailed ? (
                <Badge color="red" size="2xsmall">
                  Sync failed
                </Badge>
              ) : isSynced ? (
                <Badge color="green" size="2xsmall">
                  Synced to Payload
                </Badge>
              ) : (
                <Badge color="grey" size="2xsmall">
                  Not synced
                </Badge>
              )}
              {lastSyncedRel && (
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Last synced {lastSyncedRel}
                </Text>
              )}
            </div>

            {isFailed && meta.payload_sync_error && (
              <Text size="small" leading="compact" className="text-ui-fg-error break-all">
                {meta.payload_sync_error}
              </Text>
            )}

            {payloadAdminUrl && (
              <Text size="small" leading="compact">
                <a
                  href={payloadAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ui-fg-interactive hover:underline"
                >
                  Open in Payload ↗
                </a>
              </Text>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        <Button
          size="small"
          variant="secondary"
          onClick={() => resync.mutate()}
          isLoading={resync.isPending}
          disabled={resync.isPending || productLoading}
        >
          Re-sync this product
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default PayloadSyncWidget
