import type { Decision, DecisionMeta } from "@/lib/decisions/schema"

const API_BASE = import.meta.env.VITE_DECISIONS_API_URL ?? ""

function headers(email: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-user-email": email,
  }
}

export async function listDecisions(email: string): Promise<DecisionMeta[]> {
  const res = await fetch(`${API_BASE}/api/decisions`, {
    headers: headers(email),
  })
  if (!res.ok) throw new Error(`API responded with ${res.status}`)
  return res.json()
}

export async function getDecision(
  id: string,
  email: string,
): Promise<Decision> {
  const res = await fetch(`${API_BASE}/api/decisions/${id}`, {
    headers: headers(email),
  })
  if (!res.ok) throw new Error(`Not found`)
  return res.json()
}

export async function createDecision(
  body: Record<string, unknown>,
  email: string,
): Promise<Decision> {
  const res = await fetch(`${API_BASE}/api/decisions`, {
    method: "POST",
    headers: headers(email),
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
  email: string,
): Promise<Decision> {
  const res = await fetch(`${API_BASE}/api/decisions/${id}`, {
    method: "PUT",
    headers: headers(email),
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
  email: string,
  shareEmail?: string,
): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/decisions/${id}/share`, {
    method: "POST",
    headers: headers(email),
    body: JSON.stringify(shareEmail ? { email: shareEmail } : {}),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? "Failed to share")
  }
  return res.json()
}
