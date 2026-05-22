import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { getPayload, type CollectionSlug } from "payload"
import configPromise from "@payload-config"

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = new URL(req.url)
  const path = searchParams.get("path")
  const collection = searchParams.get("collection") as CollectionSlug | null
  const slug = searchParams.get("slug")
  const previewSecret = searchParams.get("previewSecret")

  if (previewSecret !== process.env.PAYLOAD_PREVIEW_SECRET) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!path || !collection || !slug) {
    return new Response("Insufficient search params", { status: 404 })
  }

  if (!path.startsWith("/")) {
    return new Response("This endpoint can only be used for relative previews", { status: 500 })
  }

  let user
  try {
    user = await payload.auth({ req: req as unknown as Parameters<typeof payload.auth>[0]["req"], headers: req.headers })
  } catch (error) {
    payload.logger.error({ err: error }, "Error verifying token for preview")
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!user) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  const dm = await draftMode()
  dm.enable()

  redirect(path)
}
