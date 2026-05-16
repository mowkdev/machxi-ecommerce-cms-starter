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

  it("mirrors Medusa thumbnail URL", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      thumbnail: "https://cdn.example.com/hat.jpg",
    } as never)
    expect(result.thumbnail).toBe("https://cdn.example.com/hat.jpg")
  })

  it("clears thumbnail when Medusa has none", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      thumbnail: null,
    } as never)
    expect(result.thumbnail).toBeNull()
  })

  it("does not include an images key in the payload", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      images: [{ url: "https://cdn.example.com/a.jpg" }],
    } as never)
    expect("images" in result).toBe(false)
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
