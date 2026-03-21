import { auth } from "@/auth"

const API_BASE = process.env.DECISIONS_API_URL ?? "http://localhost:8000"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_BASE}/api/decisions/${id}`, {
    headers: { "x-user-email": session.user?.email ?? "" },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const res = await fetch(`${API_BASE}/api/decisions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-email": session.user?.email ?? "",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_BASE}/api/decisions/${id}`, {
    method: "DELETE",
    headers: { "x-user-email": session.user?.email ?? "" },
  })

  if (res.status === 204) return new Response(null, { status: 204 })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
