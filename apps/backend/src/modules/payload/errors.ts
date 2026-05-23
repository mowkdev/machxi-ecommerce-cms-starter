import type { PayloadApiErrorBody } from "./types"

export class PayloadApiError extends Error {
  readonly status: number
  readonly url: string
  readonly body?: PayloadApiErrorBody

  constructor(message: string, args: { status: number; url: string; body?: PayloadApiErrorBody }) {
    super(message)
    this.name = "PayloadApiError"
    this.status = args.status
    this.url = args.url
    this.body = args.body
  }
}

/**
 * Thrown when product sync fires before an admin has saved a Payload API key
 * in Medusa Admin → Settings → Payload Integration. Subscribers should catch
 * this and log a hint rather than crashing the worker.
 */
export class PayloadConfigMissingError extends Error {
  constructor() {
    super(
      "Payload integration not configured. Go to Medusa Admin → Settings → Payload Integration and paste a Payload user API key."
    )
    this.name = "PayloadConfigMissingError"
  }
}
