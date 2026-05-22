"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

import { Checkbox } from "@/modules/common/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/common/ui/select"
import { setAddresses } from "@/lib/data/cart"
import { addressSchema, type AddressFormValues } from "@/lib/checkout/schemas"

import { ControlledField, FieldShell } from "../shared/field"
import { StepCard } from "../shared/step-card"
import { SummaryCell, SummaryRow } from "../shared/summary-row"
import type { StepState } from "../shared/step-card"

type Country = {
  iso_2?: string | null
  display_name?: string | null
  name?: string | null
}

type AddressStepProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  state: StepState
  onEdit: () => void
  onCompleted: () => void
}

export function AddressStep(props: AddressStepProps) {
  return (
    <StepCard
      step="address"
      state={props.state}
      number={1}
      title="Address"
      onEdit={props.onEdit}
      active={<AddressActive {...props} />}
      done={<AddressDone cart={props.cart} />}
    />
  )
}

function buildDefaults({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
}): AddressFormValues {
  const ship = cart.shipping_address
  // Fall back to the first country in the cart's region — the region was
  // already chosen by the user (cookie-set in middleware), so any of its
  // countries is a sane default.
  const regionCountry = cart.region?.countries?.[0]?.iso_2 ?? ""
  return {
    email: cart.email ?? customer?.email ?? "",
    first_name: ship?.first_name ?? customer?.first_name ?? "",
    last_name: ship?.last_name ?? customer?.last_name ?? "",
    address_1: ship?.address_1 ?? "",
    address_2: ship?.address_2 ?? "",
    postal_code: ship?.postal_code ?? "",
    city: ship?.city ?? "",
    province: ship?.province ?? "",
    country_code: ship?.country_code ?? regionCountry,
    phone: ship?.phone ?? customer?.phone ?? "",
    same_as_billing: true,
  }
}

function AddressActive({ cart, customer, onCompleted }: AddressStepProps) {
  const [pending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: buildDefaults({ cart, customer }),
    mode: "onBlur",
  })

  const countries: Country[] = cart.region?.countries ?? []

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null)
    startTransition(async () => {
      try {
        await setAddresses({
          email: values.email,
          shipping_address: {
            first_name: values.first_name,
            last_name: values.last_name,
            address_1: values.address_1,
            address_2: values.address_2,
            postal_code: values.postal_code,
            city: values.city,
            country_code: values.country_code,
            province: values.province,
            phone: values.phone,
          },
          same_as_billing: values.same_as_billing,
        })
        onCompleted()
      } catch (e) {
        setSubmitError(
          e instanceof Error ? e.message : "Could not save address"
        )
      }
    })
  })

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="fields">
        <ControlledField
          control={form.control}
          name="email"
          label="Email"
          full
          inputProps={{
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          }}
        />

        <ControlledField
          control={form.control}
          name="first_name"
          label="First name"
          inputProps={{ autoComplete: "given-name" }}
        />
        <ControlledField
          control={form.control}
          name="last_name"
          label="Last name"
          inputProps={{ autoComplete: "family-name" }}
        />

        <ControlledField
          control={form.control}
          name="address_1"
          label="Street address"
          full
          inputProps={{ autoComplete: "street-address" }}
        />

        <ControlledField
          control={form.control}
          name="address_2"
          label="Apartment, suite, etc."
          optional
          full
          inputProps={{ autoComplete: "address-line2" }}
        />

        <ControlledField
          control={form.control}
          name="postal_code"
          label="Postal code"
          inputProps={{ autoComplete: "postal-code" }}
        />
        <ControlledField
          control={form.control}
          name="city"
          label="City"
          inputProps={{ autoComplete: "address-level2" }}
        />

        <ControlledField
          control={form.control}
          name="province"
          label="Province / region"
          optional
          inputProps={{ autoComplete: "address-level1" }}
        />

        <Controller
          control={form.control}
          name="country_code"
          render={({ field, fieldState }) => (
            <FieldShell label="Country" error={fieldState.error?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!fieldState.error}>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.iso_2 ?? ""} value={c.iso_2 ?? ""}>
                      {c.display_name ?? c.name ?? c.iso_2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          )}
        />

        <ControlledField
          control={form.control}
          name="phone"
          label="Phone"
          optional
          full
          inputProps={{ type: "tel", autoComplete: "tel" }}
        />

        <div className="full">
          <Controller
            control={form.control}
            name="same_as_billing"
            render={({ field }) => (
              <label className="inline-check">
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                Billing address is the same as shipping
              </label>
            )}
          />
        </div>
      </div>

      {submitError && (
        <p className="err" style={{ marginTop: 14 }}>
          {submitError}
        </p>
      )}

      <button
        type="submit"
        className="continue"
        disabled={pending || form.formState.isSubmitting}
      >
        <span>{pending ? "Saving…" : "Continue to delivery"}</span>
        <span>→</span>
      </button>
    </form>
  )
}

function AddressDone({ cart }: { cart: HttpTypes.StoreCart }) {
  const ship = cart.shipping_address
  if (!ship) return null
  return (
    <SummaryRow>
      <SummaryCell label="Ship to">
        {ship.first_name} {ship.last_name}
        <br />
        {ship.address_1}
        {ship.address_2 && (
          <>
            <br />
            {ship.address_2}
          </>
        )}
        <br />
        {ship.postal_code} {ship.city}
        {ship.country_code ? `, ${ship.country_code.toUpperCase()}` : ""}
      </SummaryCell>
      <SummaryCell label="Contact">
        {cart.email}
        {ship.phone && (
          <>
            <br />
            {ship.phone}
          </>
        )}
      </SummaryCell>
    </SummaryRow>
  )
}
