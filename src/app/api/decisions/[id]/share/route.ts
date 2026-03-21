import { auth } from "@/auth"

const API_BASE = process.env.DECISIONS_API_URL ?? "http://localhost:8000"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const res = await fetch(`${API_BASE}/api/decisions/${id}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-email": session.user?.email ?? "",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
