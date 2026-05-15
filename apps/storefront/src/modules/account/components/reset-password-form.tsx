"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRow,
} from "@/modules/common/ui/form"
import { Input } from "@/modules/common/ui/input"
import { resetPassword } from "@/lib/data/customer"
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/auth-schemas"

export function ResetPasswordForm({
  email,
  token,
  countryCode,
}: {
  email: string
  token: string
  countryCode: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
    mode: "onTouched",
  })

  const onSubmit = (values: ResetPasswordValues) => {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("password", values.password)
      fd.set("token", token)
      fd.set("email", email)
      const result = await resetPassword(null, fd)
      if (!result.ok) {
        setError(result.error ?? "Could not reset password")
        return
      }
      router.push(`/${countryCode}/sign-in`)
    })
  }

  return (
    <Form {...form}>
      <form
        className="auth-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormRow>
                <FormLabel>New password</FormLabel>
              </FormRow>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormRow>
                <FormLabel>Confirm password</FormLabel>
              </FormRow>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <p className="text-[12px] text-[var(--accent-deep)]">{error}</p>
        )}

        <button type="submit" className="btn-primary" disabled={pending}>
          <span>{pending ? "Saving…" : "Reset password"}</span>
          <span className="arr">→</span>
        </button>
      </form>
    </Form>
  )
}
