export interface ClientPrincipal {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

export interface AuthInfo {
  clientPrincipal: ClientPrincipal | null
}

export async function getAuthInfo(): Promise<AuthInfo> {
  try {
    const res = await fetch("/.auth/me")
    if (!res.ok) return { clientPrincipal: null }
    return await res.json()
  } catch {
    return { clientPrincipal: null }
  }
}

export function loginUrl(provider: "aad" | "github" | "google"): string {
  return `/.auth/login/${provider}?post_login_redirect_uri=/decisions`
}

export const logoutUrl = "/.auth/logout?post_logout_redirect_uri=/signin"

export function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    aad: "Microsoft",
    github: "GitHub",
    google: "Google",
  }
  return map[provider] ?? provider
}
