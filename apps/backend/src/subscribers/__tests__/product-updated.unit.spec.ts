import handler, { config } from "../product-updated"

jest.mock("../../workflows/payload/update-payload-products", () => ({
  updatePayloadProductsWorkflow: { run: jest.fn() },
}))

describe("product-updated subscriber", () => {
  const baseEvent = { data: { id: "prod_1" }, name: "product.updated" } as never

  it("subscribes to product.updated", () => {
    expect(config.event).toBe("product.updated")
  })

  it("calls updatePayloadProductsWorkflow with the fetched product", async () => {
    const query = jest.fn().mockResolvedValue({ data: [{ id: "prod_1", title: "Updated" }] })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/update-payload-products") as {
      updatePayloadProductsWorkflow: { run: jest.Mock }
    }
    mock.updatePayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })
    await handler({ event: baseEvent, container })
    expect(mock.updatePayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { products: [{ id: "prod_1", title: "Updated" }] },
    })
  })
})
