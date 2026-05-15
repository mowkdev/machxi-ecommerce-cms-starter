"use client"

import { useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { HttpTypes } from "@medusajs/types"

import {
  ControlledField,
  FieldShell,
} from "@/modules/checkout/components/shared/field"
import { useToast } from "@/modules/common/ui/toast"
import { updateCustomer } from "@/lib/data/customer"
import { profileSchema, type ProfileValues } from "@/lib/auth-schemas"

export function ProfileForm({
  customer,
}: {
  customer: HttpTypes.StoreCustomer
}) {
  const [pending, startTransition] = useTransition()
  const { success, error: toastError } = useToast()

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: customer.first_name ?? "",
      last_name: customer.last_name ?? "",
      phone: customer.phone ?? "",
    },
    mode: "onTouched",
  })

  const onSubmit = (values: ProfileValues) => {
    startTransition(async () => {
      try {
        await updateCustomer({
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone?.trim() ? values.phone.trim() : undefined,
        })
        success("Profile updated")
        form.reset(values)
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Could not save profile")
      }
    })
  }

  return (
    <form
      className="profile-form"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="field-row">
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
      </div>

      <FieldShell label="Email" htmlFor="profile-email">
        <input
          id="profile-email"
          type="email"
          value={customer.email}
          autoComplete="email"
          disabled
        />
        <span className="help">
          <a href="mailto:hello@dabasberns.com">Contact us</a> to change the
          email on your account.
        </span>
      </FieldShell>

      <ControlledField
        control={form.control}
        name="phone"
        label={
          <span>
            Phone{" "}
            <span className="opt">— optional, for delivery questions</span>
          </span>
        }
        inputProps={{
          type: "tel",
          autoComplete: "tel",
          placeholder: "+371 …",
        }}
      />

      <button type="submit" className="btn-primary" disabled={pending}>
        <span>{pending ? "Saving…" : "Save changes"}</span>
        <span className="arr">→</span>
      </button>
    </form>
  )
}
