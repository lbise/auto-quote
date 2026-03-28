import { Navigate, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/layout/app-shell"
import DashboardPage from "@/pages/DashboardPage"
import QuoteWorkspacePage from "@/pages/QuoteWorkspacePage"
import SettingsPage from "@/pages/SettingsPage"

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/quotes/:quoteId" element={<QuoteWorkspacePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
