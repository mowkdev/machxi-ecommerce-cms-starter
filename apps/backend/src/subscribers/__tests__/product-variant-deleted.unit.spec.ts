import handler, { config } from "../product-variant-deleted"

jest.mock("../../workflows/payload/delete-payload-product-variant", () => ({
  deletePayloadProductVariantWorkflow: { run: jest.fn() },
}))

describe("product-variant-deleted", () => {
  it("subscribes to product-variant.deleted", () => {
    expect(config.event).toBe("product-variant.deleted")
  })

  it("calls deletePayloadProductVariantWorkflow with product_id and variant_id", async () => {
    const container = {
      resolve: () => ({ error: jest.fn(), info: jest.fn() }),
    } as never
    const mock = jest.requireMock("../../workflows/payload/delete-payload-product-variant") as {
      deletePayloadProductVariantWorkflow: { run: jest.Mock }
    }
    mock.deletePayloadProductVariantWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({
      event: { data: { id: "var_1", product_id: "prod_1" } },
      container,
    })
    expect(mock.deletePayloadProductVariantWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { product_id: "prod_1", variant_id: "var_1" },
    })
  })
})
