import PayloadModuleService from "../service"
import { PayloadApiError } from "../errors"
import type { PayloadFetch, PayloadProduct } from "../types"

const OPTIONS = {
  serverUrl: "http://payload.local",
  apiKey: "test-key",
  userCollection: "users",
}

function makeFetch(responses: Array<{ status?: number; body: unknown }>): {
  fetch: PayloadFetch
  calls: Array<{ url: string; init?: RequestInit }>
} {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  let i = 0
  const fetch: PayloadFetch = async (input, init) => {
    calls.push({ url: String(input), init })
    const { status = 200, body } = responses[i++] ?? { body: {} }
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  }
  return { fetch, calls }
}

describe("PayloadModuleService", () => {
  describe("makeRequest auth header", () => {
    it("sets Authorization: <userCollection> API-Key <apiKey>", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.find<PayloadProduct>("products")
      const auth = (calls[0].init?.headers as Record<string, string>)?.Authorization
      expect(auth).toBe("users API-Key test-key")
    })

    it("uses the configured userCollection name", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, { ...OPTIONS, userCollection: "admins" }, { fetch })
      await service.find<PayloadProduct>("products")
      expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("admins API-Key test-key")
    })
  })

  describe("create", () => {
    it("POSTs to /api/<collection> with JSON body", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { fetch, calls } = makeFetch([{ status: 201, body: { doc, message: "ok" } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      const result = await service.create<PayloadProduct>("products", { medusa_id: "p1" })
      expect(calls[0].url).toBe("http://payload.local/api/products")
      expect(calls[0].init?.method).toBe("POST")
      expect(calls[0].init?.body).toBe(JSON.stringify({ medusa_id: "p1" }))
      expect(result.doc.medusa_id).toBe("p1")
    })
  })

  describe("update", () => {
    it("PATCHes /api/<collection>/<id>", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { fetch, calls } = makeFetch([{ body: { doc, message: "ok" } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.update<PayloadProduct>("products", "1", { title: "new" })
      expect(calls[0].url).toBe("http://payload.local/api/products/1")
      expect(calls[0].init?.method).toBe("PATCH")
      expect(calls[0].init?.body).toBe(JSON.stringify({ title: "new" }))
    })
  })

  describe("delete", () => {
    it("DELETEs /api/<collection>/<id>", async () => {
      const { fetch, calls } = makeFetch([{ body: { message: "deleted" } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.delete("products", "1")
      expect(calls[0].url).toBe("http://payload.local/api/products/1")
      expect(calls[0].init?.method).toBe("DELETE")
    })
  })

  describe("find", () => {
    it("builds querystring from PayloadQueryOptions", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.find<PayloadProduct>("products", {
        depth: 2,
        limit: 10,
        page: 1,
        where: { medusa_id: { equals: "p1" } },
      })
      const url = new URL(calls[0].url)
      expect(url.pathname).toBe("/api/products")
      expect(url.searchParams.get("depth")).toBe("2")
      expect(url.searchParams.get("limit")).toBe("10")
      expect(url.searchParams.get("page")).toBe("1")
      expect(url.searchParams.get("where[medusa_id][equals]")).toBe("p1")
    })

    it("supports where with $in arrays", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.find<PayloadProduct>("products", {
        where: { medusa_id: { in: ["a", "b"] } },
      })
      const url = new URL(calls[0].url)
      expect(url.searchParams.getAll("where[medusa_id][in][]")).toEqual(["a", "b"])
    })
  })

  describe("list (used by virtual link)", () => {
    it("shapes the response as { payload_product: [...] }", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { fetch } = makeFetch([{ body: { docs: [doc], totalDocs: 1 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      const result = await service.list({ product_id: "p1" })
      expect(result).toEqual({ payload_product: [doc] })
    })

    it("accepts an array of product_ids", async () => {
      const docs = [
        { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" },
        { id: "2", medusa_id: "p2", createdAt: "", updatedAt: "" },
      ]
      const { fetch, calls } = makeFetch([{ body: { docs, totalDocs: 2 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      const result = await service.list({ product_id: ["p1", "p2"] })
      const url = new URL(calls[0].url)
      expect(url.searchParams.getAll("where[medusa_id][in][]")).toEqual(["p1", "p2"])
      expect(result.payload_product).toHaveLength(2)
    })
  })

  describe("error handling", () => {
    it("throws PayloadApiError on non-2xx with status and body", async () => {
      const { fetch } = makeFetch([
        { status: 422, body: { errors: [{ message: "validation failed", field: "medusa_id" }] } },
      ])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await expect(service.create("products", { medusa_id: "" })).rejects.toMatchObject({
        name: "PayloadApiError",
        status: 422,
        body: { errors: [{ message: "validation failed", field: "medusa_id" }] },
      })
    })

    it("wraps fetch network errors as PayloadApiError with status 0", async () => {
      const fetch: PayloadFetch = async () => {
        throw new Error("ECONNREFUSED")
      }
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await expect(service.find("products")).rejects.toMatchObject({
        name: "PayloadApiError",
        status: 0,
      })
    })
  })
})
