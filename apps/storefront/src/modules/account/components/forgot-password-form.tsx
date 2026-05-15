"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import { requestPasswordReset } from "@/lib/data/customer"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/auth-schemas"

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  })

  const onSubmit = (values: ForgotPasswordValues) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("email", values.email)
      await requestPasswordReset(null, fd)
      setSent(true)
    })
  }

  if (sent) {
    return (
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        If an account exists for that email, we&apos;ve sent a reset link. Check
        your inbox — it expires after a short while.
      </p>
    )
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormRow>
                <FormLabel>Email</FormLabel>
              </FormRow>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@kurzeme.lv"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <button type="submit" className="btn-primary" disabled={pending}>
          <span>{pending ? "Sending…" : "Send reset link"}</span>
          <span className="arr">→</span>
        </button>
      </form>
    </Form>
  )
}
