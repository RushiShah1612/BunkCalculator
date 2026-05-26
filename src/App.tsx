import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect, lazy, Suspense } from "react"
import { useAuth, useAuthListener } from "./hooks/useAuth"
import { LoadingSpinner } from "./components/shared/LoadingSpinner"
import { Sidebar } from "./components/layout/Sidebar"
import { useSubjectStore } from "./store/subjectStore"
import { useSubjects } from "./hooks/useSubjects"
import { ErrorBoundary } from "./components/shared/ErrorBoundary"

// Lazy load pages for performance optimization
const LoginPage = lazy(() => import("./pages/auth/LoginPage"))
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"))
const SubjectDetailPage = lazy(() => import("./pages/SubjectDetailPage"))
const AttendancePage = lazy(() => import("./pages/AttendancePage"))
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const SettingsPage = lazy(() => import("./pages/SettingsPage"))
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"))
const SharedReportPage = lazy(() => import("./pages/SharedReportPage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))

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
  const location = useLocation()

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading application..." />
  }

  const onboardingDone = localStorage.getItem("onboarding-done") === "true"
  if (!onboardingDone && subjects.length === 0 && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
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
      <Suspense fallback={<LoadingSpinner fullPage message="Loading page..." />}>
        <Routes>
          {/* Public auth routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Public report sharing route (no auth required) */}
          <Route path="/report/:id" element={<SharedReportPage />} />

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
      </Suspense>
    </BrowserRouter>
  )
}
