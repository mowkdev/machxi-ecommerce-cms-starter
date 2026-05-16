import { mapMedusaProductToPayload, mapMedusaVariantToPayload } from "../mappers"

describe("mapMedusaProductToPayload", () => {
  it("maps core fields", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      title: "Hat",
      handle: "hat",
      subtitle: "Wide brim",
      description: "A nice hat",
      thumbnail: null,
      images: [],
      options: [],
      variants: [],
    } as never)
    expect(result.medusa_id).toBe("prod_1")
    expect(result.title).toBe("Hat")
    expect(result.handle).toBe("hat")
    expect(result.subtitle).toBe("Wide brim")
  })

  it("passes plain description through as a string (Lexical hook wraps it on write)", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      title: "Hat",
      description: "Plain text",
    } as never)
    expect(result.description).toBe("Plain text")
  })

  it("maps options into the payload options shape", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      options: [
        { id: "opt_1", title: "Size", values: [{ value: "S" }, { value: "M" }] },
      ],
    } as never)
    expect(result.options).toEqual([
      { medusa_id: "opt_1", title: "Size", values: [{ value: "S" }, { value: "M" }] },
    ])
  })

  it("maps variants with option_values", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      variants: [
        {
          id: "var_1",
          title: "Small",
          sku: "HAT-S",
          options: [{ option_id: "opt_1", value: "S" }],
        },
      ],
    } as never)
    expect(result.variants).toEqual([
      {
        medusa_id: "var_1",
        title: "Small",
        sku: "HAT-S",
        option_values: [{ option_medusa_id: "opt_1", value: "S" }],
      },
    ])
  })
})

describe("mapMedusaVariantToPayload", () => {
  it("maps a single variant", () => {
    const result = mapMedusaVariantToPayload({
      id: "var_1",
      title: "Large",
      sku: "HAT-L",
      options: [{ option_id: "opt_1", value: "L" }],
    } as never)
    expect(result).toEqual({
      medusa_id: "var_1",
      title: "Large",
      sku: "HAT-L",
      option_values: [{ option_medusa_id: "opt_1", value: "L" }],
    })
  })
})
