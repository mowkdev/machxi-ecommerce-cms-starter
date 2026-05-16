import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({
    serverUrl: process.env.PAYLOAD_SERVER_URL ?? "http://localhost:8000",
    userCollection: process.env.PAYLOAD_USER_COLLECTION ?? "users",
  })
}
