import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth, useAuthListener } from "./hooks/useAuth"
import { LoadingSpinner } from "./components/shared/LoadingSpinner"
import { Sidebar } from "./components/layout/Sidebar"
import { useSubjectStore } from "./store/subjectStore"
import { useSubjects } from "./hooks/useSubjects"
import { ErrorBoundary } from "./components/shared/ErrorBoundary"

// Lazy load pages for optimization
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import SubjectsPage from "./pages/SubjectsPage"
import SubjectDetailPage from "./pages/SubjectDetailPage"
import AttendancePage from "./pages/AttendancePage"
import AnalyticsPage from "./pages/AnalyticsPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import OnboardingWizard from "./pages/OnboardingWizard"
import NotFoundPage from "./pages/NotFoundPage"

// Protected Session Wrapper Component (checks if logged in)
function ProtectedSessionRoute() {
  const { user, loading } = useAuth()

  if (loading && !user) {
    return <LoadingSpinner fullPage message="Verifying session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// App Layout Wrapper Component (adds sidebar, checks onboarding)
function AppLayout() {
  const { subjects, isLoading } = useSubjectStore()
  const { fetchSubjects } = useSubjects()
  const navigate = useNavigate()
  const location = useLocation()
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const onboardingDone = localStorage.getItem("onboarding-done") === "true"
    if (!onboardingDone && subjects.length === 0 && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true })
    } else {
      setHasCheckedOnboarding(true)
    }
  }, [subjects, isLoading, location.pathname, navigate])

  if (isLoading && !hasCheckedOnboarding) {
    return <LoadingSpinner fullPage message="Loading application..." />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 w-full">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  )
}

// Public Route Wrapper (redirects authenticated users away from Login/Register)
function PublicRoute() {
  const { user, loading } = useAuth()

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
        <Route element={<ProtectedSessionRoute />}>
          {/* Fullscreen wizard route (no sidebar) */}
          <Route path="/onboarding" element={<ErrorBoundary><OnboardingWizard /></ErrorBoundary>} />

          {/* Routed inside the sidebar layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/subjects/:id" element={<SubjectDetailPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
