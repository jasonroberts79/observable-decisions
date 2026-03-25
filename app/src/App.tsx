import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { AppLayout } from "@/layouts/AppLayout"
import { SignInPage } from "@/pages/SignInPage"
import { DecisionsPage } from "@/pages/DecisionsPage"
import { DecisionDetailPage } from "@/pages/DecisionDetailPage"
import { EditDecisionPage } from "@/pages/EditDecisionPage"
import { NewDecisionPage } from "@/pages/NewDecisionPage"
import { SettingsPage } from "@/pages/SettingsPage"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}

export function App() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/signin"
        element={
          loading ? null : user ? (
            <Navigate to="/decisions" replace />
          ) : (
            <SignInPage />
          )
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/decisions" replace />} />
        <Route path="decisions" element={<DecisionsPage />} />
        <Route path="decisions/new" element={<NewDecisionPage />} />
        <Route path="decisions/:id" element={<DecisionDetailPage />} />
        <Route path="decisions/:id/edit" element={<EditDecisionPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
