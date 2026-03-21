import { createContext, useContext, useEffect, useState } from "react"
import { getAuthInfo, type ClientPrincipal } from "@/lib/auth"

interface AuthContextValue {
  user: ClientPrincipal | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientPrincipal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuthInfo().then((info) => {
      setUser(info.clientPrincipal)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext value={{ user, loading }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
