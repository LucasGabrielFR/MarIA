import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/login'
import DashboardPage from './pages/dashboard'
import UsersPage from './pages/users'
import AiSettingsPage from './pages/ai-settings'
import DailyContentPage from './pages/daily-content'
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/ai-settings" element={<AiSettingsPage />} />
        <Route path="/daily-content" element={<DailyContentPage />} />
        
        {/* Fallback routes - to be implemented as needed */}
        <Route path="/conversations" element={<DashboardPage />} />
        <Route path="/logs" element={<DashboardPage />} />
        <Route path="/settings" element={<DashboardPage />} />
        
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  )
}

export default App
