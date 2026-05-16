import handler, { config } from "../product-variant-updated"

jest.mock("../../workflows/payload/update-payload-product-variants", () => ({
  updatePayloadProductVariantsWorkflow: { run: jest.fn() },
}))

describe("product-variant-updated", () => {
  it("subscribes to product-variant.updated", () => {
    expect(config.event).toBe("product-variant.updated")
  })

  it("calls updatePayloadProductVariantsWorkflow", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [{ id: "var_1", title: "S", sku: "X-S", product_id: "prod_1", options: [] }],
    })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/update-payload-product-variants") as {
      updatePayloadProductVariantsWorkflow: { run: jest.Mock }
    }
    mock.updatePayloadProductVariantsWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({ event: { data: { id: "var_1" } }, container })
    expect(mock.updatePayloadProductVariantsWorkflow.run).toHaveBeenCalled()
  })
})
