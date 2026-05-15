import { z } from "zod"

export const CHECKOUT_STEPS = [
  "address",
  "delivery",
  "payment",
  "review",
] as const

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

export const STEP_LABEL: Record<CheckoutStep, string> = {
  address: "Address",
  delivery: "Delivery",
  payment: "Payment",
  review: "Review",
}

// All fields are required strings — the form supplies "" as default for
// truly optional fields. Avoiding `.default()` keeps Zod's input/output
// types in sync, which matters for react-hook-form's resolver typing.
export const addressSchema = z.object({
  email: z.string().min(1, "Required").email("Invalid email"),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  address_1: z.string().min(1, "Required"),
  address_2: z.string(),
  postal_code: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  province: z.string(),
  country_code: z.string().min(1, "Required"),
  phone: z.string(),
  same_as_billing: z.boolean(),
})

export type AddressFormValues = z.infer<typeof addressSchema>

export const deliverySchema = z.object({
  shipping_option_id: z.string().min(1, "Pick a delivery option"),
})

export type DeliveryFormValues = z.infer<typeof deliverySchema>

export const paymentSchema = z
  .object({
    provider_id: z.string().min(1, "Pick a payment method"),
    card_number: z.string(),
    card_expiry: z.string(),
    card_cvc: z.string(),
    card_name: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!isCardProvider(data.provider_id)) return
    if (data.card_number.replace(/\s/g, "").length < 13) {
      ctx.addIssue({
        code: "custom",
        path: ["card_number"],
        message: "Enter a valid card number",
      })
    }
    if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(data.card_expiry)) {
      ctx.addIssue({
        code: "custom",
        path: ["card_expiry"],
        message: "Use MM / YY",
      })
    }
    if (!/^\d{3,4}$/.test(data.card_cvc)) {
      ctx.addIssue({
        code: "custom",
        path: ["card_cvc"],
        message: "3 or 4 digits",
      })
    }
    if (!data.card_name) {
      ctx.addIssue({
        code: "custom",
        path: ["card_name"],
        message: "Required",
      })
    }
  })

export type PaymentFormValues = z.infer<typeof paymentSchema>

export function isCardProvider(providerId: string): boolean {
  return /stripe|card/i.test(providerId)
}
