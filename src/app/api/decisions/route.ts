import { auth } from "@/auth"

const API_BASE = process.env.DECISIONS_API_URL ?? "http://localhost:8000"

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_BASE}/api/decisions`, {
    headers: { "x-user-email": session.user?.email ?? "" },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const res = await fetch(`${API_BASE}/api/decisions`, {
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
