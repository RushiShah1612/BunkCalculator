import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth, useAuthListener } from "./hooks/useAuth"
import { LoadingSpinner } from "./components/shared/LoadingSpinner"
import { Sidebar } from "./components/layout/Sidebar"

// Lazy load pages for optimization
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import SubjectsPage from "./pages/SubjectsPage"
import SubjectDetailPage from "./pages/SubjectDetailPage"
import AttendancePage from "./pages/AttendancePage"
import AnalyticsPage from "./pages/AnalyticsPage"
import NotFoundPage from "./pages/NotFoundPage"

// Protected Route Wrapper Component
function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Only block on loading if we don't yet know if user is authenticated
  if (loading && !user) {
    return <LoadingSpinner fullPage message="Verifying session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 w-full">
        <Outlet />
      </div>
    </div>
  )
}

// Public Route Wrapper (redirects authenticated users away from Login/Register)
function PublicRoute() {
  const { user, loading } = useAuth()

  // If user is already known, redirect immediately
  if (user) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading..." />
  }

  return <Outlet />
}

export default function App() {
  // Subscribe to supabase auth listener once
  useAuthListener()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:id" element={<SubjectDetailPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
