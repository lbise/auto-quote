import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/components/auth/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import DashboardPage from "@/pages/DashboardPage"
import LoginPage from "@/pages/LoginPage"
import QuoteWorkspacePage from "@/pages/QuoteWorkspacePage"
import SettingsPage from "@/pages/SettingsPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/quotes/:quoteId" element={<QuoteWorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ProtectedShell() {
  const { session, isLoading } = useAuth()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/70 px-6 py-5 text-sm text-muted-foreground shadow-lg backdrop-blur">
          {t("auth.loadingSession")}
        </div>
      </div>
    )
  }

  if (!session.authenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default App
