import handler, { config } from "../product-variant-created"

jest.mock("../../workflows/payload/create-payload-product-variant", () => ({
  createPayloadProductVariantWorkflow: { run: jest.fn() },
}))

describe("product-variant-created", () => {
  it("subscribes to product-variant.created", () => {
    expect(config.event).toBe("product-variant.created")
  })

  it("calls createPayloadProductVariantWorkflow", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [{ id: "var_1", title: "S", sku: "X-S", product_id: "prod_1", options: [] }],
    })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/create-payload-product-variant") as {
      createPayloadProductVariantWorkflow: { run: jest.Mock }
    }
    mock.createPayloadProductVariantWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({ event: { data: { id: "var_1" } }, container })
    expect(mock.createPayloadProductVariantWorkflow.run).toHaveBeenCalledWith({
      container,
      input: {
        product_id: "prod_1",
        variant: { id: "var_1", title: "S", sku: "X-S", product_id: "prod_1", options: [] },
      },
    })
  })
})
