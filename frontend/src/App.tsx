import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/login'
import DashboardPage from './pages/dashboard'
import UsersPage from './pages/users'
import AiSettingsPage from './pages/ai-settings'
import FlowsPage from './pages/flows'
import DailyContentPage from './pages/daily-content'
import WaUsersPage from './pages/wa-users'
import PrayersPage from './pages/prayers'
import LogsPage from './pages/logs'
import SettingsPage from './pages/settings'
import FinancePage from './pages/finance'
import PlansPage from './pages/plans'
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <Router basename="/admin">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/ai-settings" element={<AiSettingsPage />} />
        <Route path="/flows" element={<FlowsPage />} />
        <Route path="/prayers" element={<PrayersPage />} />
        <Route path="/daily-content" element={<DailyContentPage />} />
        <Route path="/wa-users" element={<WaUsersPage />} />
        <Route path="/finance" element={<FinancePage />} />
        
        {/* Fallback routes - to be implemented as needed */}
        <Route path="/conversations" element={<DashboardPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/plans" element={<PlansPage />} />
        
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  )
}

export default App
