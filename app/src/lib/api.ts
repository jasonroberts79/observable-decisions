import { auth } from "@/lib/firebase"
import type { Decision, DecisionMeta } from "@/lib/decisions/schema"

async function authHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function listDecisions(): Promise<DecisionMeta[]> {
  const res = await fetch("/api/decisions", { headers: await authHeaders() })
  if (!res.ok) throw new Error(`API responded with ${res.status}`)
  return res.json()
}

export async function getDecision(id: string): Promise<Decision> {
  const res = await fetch(`/api/decisions/${id}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(`Not found`)
  return res.json()
}

export async function createDecision(
  body: Record<string, unknown>,
): Promise<Decision> {
  const res = await fetch("/api/decisions", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? "Request failed")
  }
  return res.json()
}

export async function updateDecision(
  id: string,
  body: Record<string, unknown>,
): Promise<Decision> {
  const res = await fetch(`/api/decisions/${id}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? "Request failed")
  }
  return res.json()
}

export async function shareDecision(
  id: string,
  shareEmail?: string,
): Promise<{ url: string }> {
  const res = await fetch(`/api/decisions/${id}/share`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(shareEmail ? { email: shareEmail } : {}),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? "Failed to share")
  }
  return res.json()
}
