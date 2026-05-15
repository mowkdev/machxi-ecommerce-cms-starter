"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Control, useController, useForm } from "react-hook-form"
import { HttpTypes } from "@medusajs/types"

import {
  ControlledField,
  FieldShell,
} from "@/modules/checkout/components/shared/field"
import { useToast } from "@/modules/common/ui/toast"
import {
  addCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@/lib/data/customer"
import { addressSchema, type AddressValues } from "@/lib/auth-schemas"

type Country = { code: string; label: string }

type Mode =
  | { kind: "new" }
  | { kind: "edit"; address: HttpTypes.StoreCustomerAddress }
  | null

const EMPTY_VALUES: AddressValues = {
  first_name: "",
  last_name: "",
  address_1: "",
  postal_code: "",
  city: "",
  province: "",
  country_code: "",
  phone: "",
  is_default_shipping: false,
}

function toFormValues(
  a: HttpTypes.StoreCustomerAddress,
  fallbackCountry: string
): AddressValues {
  return {
    first_name: a.first_name ?? "",
    last_name: a.last_name ?? "",
    address_1: a.address_1 ?? "",
    postal_code: a.postal_code ?? "",
    city: a.city ?? "",
    province: a.province ?? "",
    country_code: a.country_code ?? fallbackCountry,
    phone: a.phone ?? "",
    is_default_shipping: a.is_default_shipping ?? false,
  }
}

export function AddressBook({
  addresses,
  countryCode,
  countries,
}: {
  addresses: HttpTypes.StoreCustomerAddress[]
  countryCode: string
  countries: Country[]
}) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [mode, setMode] = useState<Mode>(null)
  const [pending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)

  const fallbackCountry =
    countries.find((c) => c.code === countryCode.toLowerCase())?.code ??
    countries[0]?.code ??
    ""

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { ...EMPTY_VALUES, country_code: fallbackCountry },
    mode: "onTouched",
  })

  useEffect(() => {
    if (mode?.kind === "new") {
      form.reset({ ...EMPTY_VALUES, country_code: fallbackCountry })
    } else if (mode?.kind === "edit") {
      form.reset(toFormValues(mode.address, fallbackCountry))
    }
    if (mode && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const onSubmit = (values: AddressValues) => {
    const fd = new FormData()
    fd.set("first_name", values.first_name)
    fd.set("last_name", values.last_name)
    fd.set("address_1", values.address_1)
    fd.set("postal_code", values.postal_code)
    fd.set("city", values.city)
    fd.set("province", values.province ?? "")
    fd.set("country_code", values.country_code)
    fd.set("phone", values.phone ?? "")

    startTransition(async () => {
      if (mode?.kind === "edit") {
        fd.set("addressId", mode.address.id)
        const res = await updateCustomerAddress(
          { addressId: mode.address.id },
          fd
        )
        if (!res.success) {
          toastError(res.error ?? "Could not save address")
          return
        }
        success("Address updated")
      } else {
        const res = await addCustomerAddress(
          {
            isDefaultShipping:
              values.is_default_shipping || addresses.length === 0,
          },
          fd
        )
        if (!res.success) {
          toastError(res.error ?? "Could not save address")
          return
        }
        success("Address added")
      }
      setMode(null)
      router.refresh()
    })
  }

  const remove = (id: string) => {
    setRemovingId(id)
    startTransition(async () => {
      const res = await deleteCustomerAddress(id)
      setRemovingId(null)
      if (!res.success) {
        toastError(res.error ?? "Could not delete address")
        return
      }
      success("Address removed")
      if (mode?.kind === "edit" && mode.address.id === id) {
        setMode(null)
      }
      router.refresh()
    })
  }

  const cancel = () => setMode(null)

  const heading = mode?.kind === "edit" ? "Edit address" : "New address"

  return (
    <>
      {mode && (
        <div className="addr-form" ref={formRef}>
          <div className="form-head">
            <h3>{heading}</h3>
            <button type="button" className="cancel" onClick={cancel}>
              Cancel
            </button>
          </div>

          <form
            className="fields"
            id="addrFormFields"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <ControlledField
              control={form.control}
              name="first_name"
              label="First name"
              inputProps={{
                type: "text",
                autoComplete: "given-name",
                placeholder: "Jānis",
              }}
            />
            <ControlledField
              control={form.control}
              name="last_name"
              label="Last name"
              inputProps={{
                type: "text",
                autoComplete: "family-name",
                placeholder: "Bērziņš",
              }}
            />

            <ControlledField
              control={form.control}
              name="address_1"
              label="Street address"
              full
              inputProps={{
                type: "text",
                autoComplete: "street-address",
                placeholder: "Hipokrāta 35",
              }}
            />

            <ControlledField
              control={form.control}
              name="postal_code"
              label="Postal code"
              inputProps={{
                type: "text",
                autoComplete: "postal-code",
                placeholder: "LV-1079",
              }}
            />
            <ControlledField
              control={form.control}
              name="city"
              label="City"
              inputProps={{
                type: "text",
                autoComplete: "address-level2",
                placeholder: "Rīga",
              }}
            />

            <ControlledField
              control={form.control}
              name="province"
              label={
                <span>
                  Province / region <span className="opt">— optional</span>
                </span>
              }
              inputProps={{
                type: "text",
                autoComplete: "address-level1",
              }}
            />

            <CountryField control={form.control} countries={countries} />

            <ControlledField
              control={form.control}
              name="phone"
              full
              label={
                <span>
                  Phone{" "}
                  <span className="opt">
                    — optional, for delivery questions
                  </span>
                </span>
              }
              inputProps={{
                type: "tel",
                autoComplete: "tel",
                placeholder: "+371 …",
              }}
            />
          </form>

          <div className="form-actions">
            <button
              type="submit"
              form="addrFormFields"
              className="btn-primary"
              disabled={pending}
            >
              <span>
                {pending
                  ? "Saving…"
                  : mode.kind === "edit"
                    ? "Save changes"
                    : "Save address"}
              </span>
              <span className="arr">→</span>
            </button>
            <button type="button" className="cancel-link" onClick={cancel}>
              Cancel
            </button>
            {mode.kind === "edit" && (
              <button
                type="button"
                className="danger"
                disabled={removingId === mode.address.id}
                onClick={() => remove(mode.address.id)}
              >
                {removingId === mode.address.id ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="addr-grid">
        {addresses.map((a) => {
          const isDefault =
            a.is_default_shipping || a.is_default_billing || false
          const country = countries.find(
            (c) => c.code === (a.country_code ?? "").toLowerCase()
          )
          return (
            <article
              key={a.id}
              className={isDefault ? "addr-card default" : "addr-card"}
            >
              <span className="name">
                {[a.first_name, a.last_name].filter(Boolean).join(" ") ||
                  "Address"}
                {isDefault && <span className="badge">Default</span>}
              </span>
              <div className="lines">
                {a.address_1}
                {a.address_2 ? (
                  <>
                    <br />
                    {a.address_2}
                  </>
                ) : null}
                <br />
                {[a.postal_code, a.city].filter(Boolean).join(" ")}
                {a.province ? <>, {a.province}</> : null}
                <br />
                {country?.label ?? a.country_code?.toUpperCase() ?? ""}
                {a.phone && <span className="muted">{a.phone}</span>}
              </div>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => setMode({ kind: "edit", address: a })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={removingId === a.id}
                  onClick={() => remove(a.id)}
                >
                  {removingId === a.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </article>
          )
        })}

        {mode?.kind !== "new" && (
          <button
            type="button"
            className="addr-add"
            onClick={() => setMode({ kind: "new" })}
          >
            <span className="plus" aria-hidden="true">
              +
            </span>
            <span className="lbl">Add address</span>
          </button>
        )}
      </div>
    </>
  )
}

function CountryField({
  control,
  countries,
}: {
  control: Control<AddressValues>
  countries: Country[]
}) {
  const { field, fieldState } = useController({ control, name: "country_code" })
  return (
    <FieldShell label="Country" error={fieldState.error?.message}>
      <select
        autoComplete="country"
        {...field}
        value={field.value ?? ""}
        aria-invalid={fieldState.error ? true : undefined}
      >
        <option value="">Select country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
