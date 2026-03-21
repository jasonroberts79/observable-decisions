import { auth } from "@/auth"
import { getStorageAdapter } from "@/lib/storage"
import { DecisionSchema } from "@/lib/decisions/schema"
import { nanoid } from "nanoid"

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const adapter = getStorageAdapter(session)
    const decisions = await adapter.list()
    return Response.json(decisions)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const now = new Date().toISOString()
    const id = nanoid()

    const decision = DecisionSchema.parse({
      ...body,
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user?.email ?? session.user?.name ?? "unknown",
    })

    const adapter = getStorageAdapter(session)
    await adapter.put(id, decision)

    return Response.json(decision, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 400 })
  }
}
