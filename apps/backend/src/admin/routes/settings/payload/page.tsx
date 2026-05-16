import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

type ConfigResponse = { serverUrl: string; userCollection: string }

const PayloadSettingsPage = () => {
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const { data: cfg } = useQuery<ConfigResponse>({
    queryKey: ["payload-config"],
    queryFn: async () => {
      const res = await fetch("/admin/payload/config", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load Payload config")
      return res.json()
    },
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
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Container className="p-6">
      <Heading level="h1">Payload CMS</Heading>
      <div className="mt-4 space-y-2">
        <Text>
          <span className="font-semibold">Server URL:</span>{" "}
          <code>{cfg?.serverUrl ?? "loading..."}</code>
        </Text>
        <Text>
          <span className="font-semibold">User collection:</span>{" "}
          <code>{cfg?.userCollection ?? "loading..."}</code>
        </Text>
      </div>
      <div className="mt-6">
        <Button onClick={() => sync.mutate()} isLoading={sync.isPending}>
          Sync products to Payload
        </Button>
        {lastEvent && (
          <Text className="mt-2 text-sm">Last triggered event: <code>{lastEvent}</code></Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payload CMS",
})

export default PayloadSettingsPage
