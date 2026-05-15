import { z } from "zod"

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
})
export type SignInValues = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(60, { message: "Too long" }),
  last_name: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(60, { message: "Too long" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
  phone: z
    .string()
    .trim()
    .max(40, { message: "Too long" })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Za-z]/, { message: "Include at least one letter" })
    .regex(/\d/, { message: "Include at least one number" }),
})
export type SignUpValues = z.infer<typeof signUpSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Za-z]/, { message: "Include at least one letter" })
      .regex(/\d/, { message: "Include at least one number" }),
    confirm: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const profileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(60, { message: "Too long" }),
  last_name: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(60, { message: "Too long" }),
  phone: z
    .string()
    .trim()
    .max(40, { message: "Too long" })
    .optional()
    .or(z.literal("")),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const addressSchema = z.object({
  first_name: z.string().trim().min(1, { message: "First name is required" }),
  last_name: z.string().trim().min(1, { message: "Last name is required" }),
  address_1: z
    .string()
    .trim()
    .min(1, { message: "Street address is required" }),
  postal_code: z.string().trim().min(1, { message: "Postal code is required" }),
  city: z.string().trim().min(1, { message: "City is required" }),
  province: z.string().trim().optional().or(z.literal("")),
  country_code: z.string().trim().min(2, { message: "Pick a country" }),
  phone: z.string().trim().optional().or(z.literal("")),
  is_default_shipping: z.boolean().optional(),
})
export type AddressValues = z.infer<typeof addressSchema>
