import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from '@/design-system/layout/AppShell'
import { LoadingSpinner } from '@/design-system/motion/motion-primitives'

// Lazy-load feature page components
const LazyLogin = React.lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const LazyDashboard = React.lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const LazyCasesList = React.lazy(() =>
  import('@/features/cases/CasesListPage').then((m) => ({ default: m.CasesListPage }))
)
const LazyCaseDetail = React.lazy(() =>
  import('@/features/cases/CaseDetailPage').then((m) => ({ default: m.CaseDetailPage }))
)
const LazyComplaintsList = React.lazy(() =>
  import('@/features/complaints/ComplaintsListPage').then((m) => ({ default: m.ComplaintsListPage }))
)
const LazyComplaintDetail = React.lazy(() =>
  import('@/features/complaints/ComplaintDetailPage').then((m) => ({ default: m.ComplaintDetailPage }))
)
const LazyCitizensList = React.lazy(() =>
  import('@/features/citizens/CitizensListPage').then((m) => ({ default: m.CitizensListPage }))
)
const LazyCitizenProfile = React.lazy(() =>
  import('@/features/citizens/CitizenProfilePage').then((m) => ({ default: m.CitizenProfilePage }))
)
const LazyOfficersList = React.lazy(() =>
  import('@/features/officers/OfficersListPage').then((m) => ({ default: m.OfficersListPage }))
)
const LazyOfficerDetail = React.lazy(() =>
  import('@/features/officers/OfficerDetailPage').then((m) => ({ default: m.OfficerDetailPage }))
)
const LazyAdmin = React.lazy(() =>
  import('@/features/admin/AdminPage').then((m) => ({ default: m.AdminPage }))
)
const LazyMonitoring = React.lazy(() =>
  import('@/features/monitoring/MonitoringPage').then((m) => ({ default: m.MonitoringPage }))
)
const LazySearch = React.lazy(() =>
  import('@/features/search/GlobalSearchPage').then((m) => ({ default: m.GlobalSearchPage }))
)
const LazyProfile = React.lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)
const LazyReports = React.lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
)

const LazyEvidenceHub = React.lazy(() =>
  import('@/features/evidence/EvidencePage').then((m) => ({ default: m.EvidencePage }))
)
const LazyFIRWorkspace = React.lazy(() =>
  import('@/features/fir/FIRWorkspacePage').then((m) => ({ default: m.FIRWorkspacePage }))
)
const LazyAnalytics = React.lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
)
const LazyCourt = React.lazy(() =>
  import('@/features/cases/CourtPage').then((m) => ({ default: m.CourtPage }))
)
const LazyDocuments = React.lazy(() =>
  import('@/features/cases/DocumentCenterPage').then((m) => ({ default: m.DocumentCenterPage }))
)

// Error page fallbacks
const AccessDenied = React.lazy(() => import('./AccessDeniedPage'))
const NotFound = React.lazy(() => import('./NotFoundPage'))

interface RouteGuardProps {
  children: React.ReactElement
  allowedRoles?: string[]
}

export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}

export const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
          <LoadingSpinner size={40} />
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LazyLogin />
            </PublicRoute>
          }
        />

        {/* Protected App Shell Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyCasesList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyCaseDetail />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyComplaintsList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyComplaintDetail />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/citizens"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyCitizensList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/citizens/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyCitizenProfile />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/firs"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyFIRWorkspace />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/evidence"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyEvidenceHub />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'INVESTIGATOR']}>
              <AppShell>
                <LazyAnalytics />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazySearch />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/court"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyCourt />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyDocuments />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/telemetry"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell>
                <LazyMonitoring />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/officers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
              <AppShell>
                <LazyOfficersList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/officers/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
              <AppShell>
                <LazyOfficerDetail />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell>
                <LazyAdmin />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <LazyProfile />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
              <AppShell>
                <LazyReports />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Error Fallbacks */}
        <Route path="/403" element={<AccessDenied />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
export default AppRoutes
