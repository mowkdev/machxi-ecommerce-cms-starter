import http from "http"
import type { AddressInfo } from "net"

export type RecordedRequest = {
  method: string
  url: string
  pathname: string
  searchParams: URLSearchParams
  body: unknown
  headers: Record<string, string>
}

type Handler = (req: RecordedRequest) => { status?: number; body?: unknown }

export interface PayloadMockServer {
  url: string
  requests: RecordedRequest[]
  setHandler(handler: Handler): void
  close(): Promise<void>
  reset(): void
}

export async function startPayloadMockServer(): Promise<PayloadMockServer> {
  const requests: RecordedRequest[] = []
  let handler: Handler = () => ({ status: 200, body: { docs: [], totalDocs: 0 } })
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      let parsed: unknown = undefined
      if (raw.length) {
        try { parsed = JSON.parse(raw) } catch { parsed = raw }
      }
      const url = new URL(req.url ?? "/", "http://localhost")
      const record: RecordedRequest = {
        method: req.method ?? "GET",
        url: req.url ?? "/",
        pathname: url.pathname,
        searchParams: url.searchParams,
        body: parsed,
        headers: Object.fromEntries(
          Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v ?? "")])
        ),
      }
      requests.push(record)
      const result = handler(record)
      res.statusCode = result.status ?? 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify(result.body ?? {}))
    })
  })
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const address = server.address() as AddressInfo
  const url = `http://127.0.0.1:${address.port}`
  return {
    url,
    requests,
    setHandler(h) { handler = h },
    reset() { requests.length = 0 },
    close: () => new Promise<void>((r) => server.close(() => r())),
  }
}
