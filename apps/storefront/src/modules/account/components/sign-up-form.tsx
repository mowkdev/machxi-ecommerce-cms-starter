"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import { signup } from "@/lib/data/customer"
import { signUpSchema, type SignUpValues } from "@/lib/auth-schemas"

export function SignUpForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
    },
    mode: "onTouched",
  })

  const onSubmit = (values: SignUpValues) => {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("first_name", values.first_name)
      formData.set("last_name", values.last_name)
      formData.set("email", values.email)
      if (values.phone) formData.set("phone", values.phone)
      formData.set("password", values.password)

      const result = await signup(null, formData)
      if (typeof result === "string") {
        setError(humanize(result))
        return
      }
      router.push("/account")
      router.refresh()
    })
  }

  return (
    <>
      <GoogleButton label="Sign up with Google" disabled={pending} />

      <div className="or-divider" role="separator">
        Or
      </div>

      <Form {...form}>
        <form
          className="auth-form"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="field-row">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormRow>
                    <FormLabel>First name</FormLabel>
                  </FormRow>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="given-name"
                      placeholder="Jānis"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormRow>
                    <FormLabel>Last name</FormLabel>
                  </FormRow>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="family-name"
                      placeholder="Bērziņš"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormRow>
                  <FormLabel>Phone (optional)</FormLabel>
                </FormRow>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+371 …"
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

          {error && (
            <p className="text-[12px] text-[var(--accent-deep)]">{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={pending}>
            <span>{pending ? "Creating…" : "Create account"}</span>
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
