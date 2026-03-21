import { auth } from "@/auth"
import { getStorageAdapter } from "@/lib/storage"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const email: string | undefined = body.email

    const adapter = getStorageAdapter(session)
    const shareUrl = await adapter.share(id, email)

    return Response.json({ url: shareUrl })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
