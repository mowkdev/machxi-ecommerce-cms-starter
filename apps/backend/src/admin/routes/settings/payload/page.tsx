import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

type ConfigResponse = {
  serverUrl: string
  userCollection: string
  hasApiKey: boolean
}

type FailureRow = {
  id: string
  title: string
  error: string
  updated_at: string
}

type StatsResponse = {
  total: number
  synced: number
  not_synced: number
  failed: number
  last_synced_at: string | null
  recent_failures: FailureRow[]
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`)
  return res.json() as Promise<T>
}

const formatTimestamp = (iso: string | null) => {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <div className="bg-ui-bg-subtle rounded-md px-4 py-3">
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text size="large" weight="plus" className="mt-1">
      {value}
    </Text>
  </div>
)

const POLL_INTERVAL_MS = 2500
const POLL_DURATION_MS = 60_000

const PayloadSettingsPage = () => {
  const queryClient = useQueryClient()
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const pollStartedAt = useRef<number | null>(null)
  const previousSynced = useRef<number | null>(null)
  const idleTicks = useRef(0)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [userCollectionInput, setUserCollectionInput] = useState("")

  const { data: cfg } = useQuery<ConfigResponse>({
    queryKey: ["payload-config"],
    queryFn: () => fetchJson<ConfigResponse>("/admin/payload/config"),
  })

  useEffect(() => {
    if (cfg?.userCollection && !userCollectionInput) {
      setUserCollectionInput(cfg.userCollection)
    }
  }, [cfg, userCollectionInput])

  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["payload-sync-stats"],
    queryFn: () => fetchJson<StatsResponse>("/admin/payload/sync/stats"),
    refetchInterval: polling ? POLL_INTERVAL_MS : false,
  })

  // Auto-stop polling: hard timeout after POLL_DURATION_MS, or after 3 ticks
  // with no change in `synced` (the subscriber has finished its work).
  useEffect(() => {
    if (!polling || !stats) return
    if (pollStartedAt.current && Date.now() - pollStartedAt.current > POLL_DURATION_MS) {
      setPolling(false)
      return
    }
    if (previousSynced.current === stats.synced) {
      idleTicks.current += 1
      if (idleTicks.current >= 3) setPolling(false)
    } else {
      idleTicks.current = 0
      previousSynced.current = stats.synced
    }
  }, [polling, stats])

  const saveIntegration = useMutation({
    mutationFn: async () => {
      const res = await fetch("/admin/payload/integration", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          userCollection: userCollectionInput || "users",
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message || `Save failed (${res.status})`)
      }
      return res.json() as Promise<{ hasApiKey: boolean; userCollection: string }>
    },
    onSuccess: () => {
      toast.success("Payload API key saved")
      setApiKeyInput("")
      queryClient.invalidateQueries({ queryKey: ["payload-config"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sync = useMutation({
    mutationFn: async () => {
      const res = await fetch("/admin/payload/sync/products", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Sync failed")
      return res.json() as Promise<{ ok: boolean; event: string }>
    },
    onSuccess: (data) => {
      setLastEvent(data.event)
      toast.success("Payload sync triggered")
      pollStartedAt.current = Date.now()
      previousSynced.current = stats?.synced ?? null
      idleTicks.current = 0
      setPolling(true)
      queryClient.invalidateQueries({ queryKey: ["payload-sync-stats"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Container className="p-6">
      <Heading level="h1">Payload CMS</Heading>

      <div className="mt-6">
        <div className="flex items-center gap-2">
          <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
            Connection
          </Text>
          {cfg ? (
            <Badge color={cfg.hasApiKey ? "green" : "orange"} size="2xsmall">
              {cfg.hasApiKey ? "API key set" : "API key missing"}
            </Badge>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          <Text>
            <span className="font-semibold">Server URL:</span>{" "}
            <code>{cfg?.serverUrl ?? "loading…"}</code>
            <Text size="small" className="text-ui-fg-subtle">
              Set via the <code>PAYLOAD_SERVER_URL</code> env var on the backend.
            </Text>
          </Text>
        </div>

        <div className="mt-4 max-w-xl space-y-3">
          <div>
            <Label htmlFor="payload-api-key" size="small">
              Payload user API key
            </Label>
            <Input
              id="payload-api-key"
              type="password"
              autoComplete="off"
              placeholder={cfg?.hasApiKey ? "•••••••• (replace to rotate)" : "Paste key here"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Generate in Payload Admin → Users → your user → <strong>Enable API Key</strong>, then save and copy the value.
            </Text>
          </div>
          <div>
            <Label htmlFor="payload-user-collection" size="small">
              User collection slug
            </Label>
            <Input
              id="payload-user-collection"
              placeholder="users"
              value={userCollectionInput}
              onChange={(e) => setUserCollectionInput(e.target.value)}
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Defaults to <code>users</code>. Change only if your Payload admin user collection has a different slug.
            </Text>
          </div>
          <Button
            size="small"
            onClick={() => saveIntegration.mutate()}
            isLoading={saveIntegration.isPending}
            disabled={saveIntegration.isPending || !apiKeyInput.trim()}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
            Sync status
          </Text>
          {polling && (
            <Badge color="blue" size="2xsmall">
              Live · updating
            </Badge>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total products" value={statsLoading ? "…" : stats?.total ?? 0} />
          <StatCard label="Synced" value={statsLoading ? "…" : stats?.synced ?? 0} />
          <StatCard label="Not synced" value={statsLoading ? "…" : stats?.not_synced ?? 0} />
          <StatCard label="Failed" value={statsLoading ? "…" : stats?.failed ?? 0} />
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-subtle mt-3">
          Last sync activity: {formatTimestamp(stats?.last_synced_at ?? null)}
        </Text>
      </div>

      {stats?.recent_failures.length ? (
        <div className="mt-6">
          <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
            Recent failures
          </Text>
          <div className="mt-2 divide-y divide-ui-border-base rounded-md border border-ui-border-base">
            {stats.recent_failures.map((failure) => (
              <div key={failure.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge color="red" size="2xsmall">
                    failed
                  </Badge>
                  <Text size="small" weight="plus">
                    {failure.title}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    ({failure.id})
                  </Text>
                </div>
                <Text size="small" className="text-ui-fg-subtle mt-1 break-all">
                  {failure.error}
                </Text>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <Button
          size="small"
          onClick={() => sync.mutate()}
          isLoading={sync.isPending}
          disabled={sync.isPending}
        >
          Sync products to Payload
        </Button>
        {lastEvent && (
          <Text size="small" leading="compact" className="text-ui-fg-subtle mt-2">
            Last triggered event: <code>{lastEvent}</code>
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payload CMS",
})

export default PayloadSettingsPage
