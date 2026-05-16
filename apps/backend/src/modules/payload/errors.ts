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
