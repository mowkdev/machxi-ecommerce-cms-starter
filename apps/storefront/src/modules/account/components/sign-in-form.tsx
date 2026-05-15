"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { GoogleButton } from "@/modules/account/components/google-button"
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
import { login } from "@/lib/data/customer"
import { signInSchema, type SignInValues } from "@/lib/auth-schemas"

export function SignInForm({ countryCode }: { countryCode: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  })

  const onSubmit = (values: SignInValues) => {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("email", values.email)
      formData.set("password", values.password)
      const result = await login(null, formData)
      if (typeof result === "string" && result) {
        setError(humanize(result))
        return
      }
      router.push(`/${countryCode}/account`)
      router.refresh()
    })
  }

  return (
    <>
      <GoogleButton label="Continue with Google" disabled={pending} />

      <div className="or-divider" role="separator">
        Or
      </div>

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormRow>
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={`/${countryCode}/forgot-password`}
                    className="link-mini"
                  >
                    Forgot?
                  </Link>
                </FormRow>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
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
            <span>{pending ? "Signing in…" : "Sign in"}</span>
            <span className="arr">→</span>
          </button>
        </form>
      </Form>
    </>
  )
}

function humanize(raw: string): string {
  return raw
    .replace(/^Error:\s*/i, "")
    .replace(/\.$/, "")
    .trim()
}
