"use client"

import { type ReactNode, useId } from "react"
import {
  type Control,
  type FieldPath,
  type FieldValues,
  useController,
} from "react-hook-form"

import { cn } from "@/lib/utils"

type FieldShellProps = {
  label: ReactNode
  optional?: boolean
  error?: string
  full?: boolean
  className?: string
  children: ReactNode
  htmlFor?: string
}

export function FieldShell({
  label,
  optional,
  error,
  full,
  className,
  children,
  htmlFor,
}: FieldShellProps) {
  return (
    <div
      className={cn("field", full && "full", error && "has-error", className)}
    >
      <label className="lbl" htmlFor={htmlFor}>
        {label}
        {optional && <span className="opt">— optional</span>}
      </label>
      {children}
      {error && <span className="err">{error}</span>}
    </div>
  )
}

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "onChange" | "onBlur" | "id" | "ref"
>

type ControlledFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: ReactNode
  optional?: boolean
  full?: boolean
  inputProps?: InputProps
}

/**
 * RHF-controlled text input wrapped in the design's hairline `.field` shell.
 * The shell handles label + error rendering; the input itself is a plain
 * <input> styled by the `.field input` CSS rules.
 */
export function ControlledField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  optional,
  full,
  inputProps,
}: ControlledFieldProps<TFieldValues>) {
  const id = useId()
  const { field, fieldState } = useController({ control, name })
  return (
    <FieldShell
      label={label}
      optional={optional}
      full={full}
      htmlFor={id}
      error={fieldState.error?.message}
    >
      <input
        id={id}
        {...inputProps}
        name={field.name}
        ref={field.ref}
        value={(field.value as string | number | undefined) ?? ""}
        onChange={field.onChange}
        onBlur={field.onBlur}
        aria-invalid={fieldState.error ? true : undefined}
      />
    </FieldShell>
  )
}
