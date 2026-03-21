import { auth } from "@/auth"
import { getStorageAdapter } from "@/lib/storage"
import { DecisionSchema } from "@/lib/decisions/schema"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const adapter = getStorageAdapter(session)
    const decision = await adapter.get(id)
    return Response.json(decision)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 404 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const adapter = getStorageAdapter(session)
    const existing = await adapter.get(id)
    const body = await request.json()

    const updated = DecisionSchema.parse({
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    })

    await adapter.put(id, updated)
    return Response.json(updated)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const adapter = getStorageAdapter(session)
    await adapter.delete(id)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
