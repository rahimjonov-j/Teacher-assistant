import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { FullScreenLoader } from '@/components/shared/loading-state'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'

const PublicLayout = lazy(async () => ({
  default: (await import('@/components/layout/public-layout')).PublicLayout,
}))
const TeacherLayout = lazy(async () => ({
  default: (await import('@/components/layout/teacher-layout')).TeacherLayout,
}))
const AdminLayout = lazy(async () => ({
  default: (await import('@/components/layout/admin-layout')).AdminLayout,
}))
const LoginPage = lazy(async () => ({
  default: (await import('@/pages/public/login-page')).LoginPage,
}))
const ResetPasswordPage = lazy(async () => ({
  default: (await import('@/pages/public/reset-password-page')).ResetPasswordPage,
}))
const RegisterPage = lazy(async () => ({
  default: (await import('@/pages/public/register-page')).RegisterPage,
}))
const LandingPage = lazy(async () => ({
  default: (await import('@/pages/public/landing-page')).LandingPage,
}))
const DashboardPage = lazy(async () => ({
  default: (await import('@/pages/app/dashboard-page')).DashboardPage,
}))
const ClassesPage = lazy(async () => ({
  default: (await import('@/pages/app/classes-page')).ClassesPage,
}))
const MessengerPage = lazy(async () => ({
  default: (await import('@/pages/app/messenger-page')).MessengerPage,
}))
const CalendarPage = lazy(async () => ({
  default: (await import('@/pages/app/calendar-page')).CalendarPage,
}))
const DatabasePage = lazy(async () => ({
  default: (await import('@/pages/app/database-page')).DatabasePage,
}))
const AttendancePage = lazy(async () => ({
  default: (await import('@/pages/app/attendance-page')).AttendancePage,
}))
const GeneratorPage = lazy(async () => ({
  default: (await import('@/pages/app/generator-page')).GeneratorPage,
}))
const ContentDetailPage = lazy(async () => ({
  default: (await import('@/pages/app/content-detail-page')).ContentDetailPage,
}))
const SettingsPage = lazy(async () => ({
  default: (await import('@/pages/app/settings-page')).SettingsPage,
}))
const BillingPage = lazy(async () => ({
  default: (await import('@/pages/app/billing-page')).BillingPage,
}))
const AdminDashboardPage = lazy(async () => ({
  default: (await import('@/pages/admin/dashboard-page')).AdminDashboardPage,
}))
const AdminTeachersPage = lazy(async () => ({
  default: (await import('@/pages/admin/teachers-page')).AdminTeachersPage,
}))
const AdminUsageAnalyticsPage = lazy(async () => ({
  default: (await import('@/pages/admin/usage-analytics-page')).AdminUsageAnalyticsPage,
}))
const AdminFeatureAnalyticsPage = lazy(async () => ({
  default: (await import('@/pages/admin/feature-analytics-page')).AdminFeatureAnalyticsPage,
}))
const AdminSubscriptionsPage = lazy(async () => ({
  default: (await import('@/pages/admin/subscriptions-page')).AdminSubscriptionsPage,
}))
const AdminActivityPage = lazy(async () => ({
  default: (await import('@/pages/admin/activity-page')).AdminActivityPage,
}))
const StudentLoginPage = lazy(async () => ({
  default: (await import('@/pages/student/student-login-page')).StudentLoginPage,
}))
const StudentDashboardPage = lazy(async () => ({
  default: (await import('@/pages/student/student-dashboard-page')).StudentDashboardPage,
}))
const StudentAssignmentPage = lazy(async () => ({
  default: (await import('@/pages/student/student-assignment-page')).StudentAssignmentPage,
}))

function LazyRoute({ children, label = 'Sahifa yuklanmoqda' }: { children: ReactNode; label?: string }) {
  return <Suspense fallback={<FullScreenLoader label={label} />}>{children}</Suspense>
}

function ProtectedGate() {
  const { initialized, session, profile, loading } = useAuth()
  const { t } = useI18n()

  if (!initialized || loading || (session && !profile)) {
    return <FullScreenLoader label={t('routes.panelLoading')} />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function AdminGate() {
  const { initialized, session, profile, loading } = useAuth()
  const { t } = useI18n()

  if (!initialized || loading || (session && !profile)) {
    return <FullScreenLoader label={t('routes.adminLoading')} />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}

function TeacherGate() {
  const { initialized, session, profile, loading } = useAuth()
  const { t } = useI18n()

  if (!initialized || loading || (session && !profile)) {
    return <FullScreenLoader label={t('routes.panelLoading')} />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}

function GuestGate() {
  const { session, profile } = useAuth()
  const { t } = useI18n()

  if (session) {
    if (!profile) {
      return <FullScreenLoader label={t('routes.redirecting')} />
    }

    return <Navigate to={profile.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  }

  return <Outlet />
}

function HomeGate() {
  const { session, profile } = useAuth()
  const { t } = useI18n()

  if (session) {
    if (!profile) {
      return <FullScreenLoader label={t('routes.redirecting')} />
    }

    return <Navigate to={profile.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  }

  return (
    <LazyRoute label={t('routes.homeLoading')}>
      <LandingPage />
    </LazyRoute>
  )
}

export function AppRoutes() {
  const { t } = useI18n()

  return (
    <Routes>
      <Route
        element={
          <LazyRoute label={t('routes.homeLoading')}>
            <PublicLayout />
          </LazyRoute>
        }
      >
        <Route path="/" element={<HomeGate />} />
        <Route
          path="/pricing"
          element={
            <LazyRoute label={t('routes.homeLoading')}>
              <LandingPage />
            </LazyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <LazyRoute label={t('routes.resetLoading')}>
              <ResetPasswordPage />
            </LazyRoute>
          }
        />
        <Route element={<GuestGate />}>
          <Route
            path="/login"
            element={
              <LazyRoute label={t('routes.loginLoading')}>
                <LoginPage />
              </LazyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <LazyRoute label={t('routes.registerLoading')}>
                <RegisterPage />
              </LazyRoute>
            }
          />
        </Route>
      </Route>

      <Route
        path="/student-login"
        element={
          <LazyRoute label="Student login loading">
            <StudentLoginPage />
          </LazyRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <LazyRoute label="Student dashboard loading">
            <StudentDashboardPage />
          </LazyRoute>
        }
      />
      <Route
        path="/student/assignments/:id"
        element={
          <LazyRoute label="Assignment loading">
            <StudentAssignmentPage />
          </LazyRoute>
        }
      />

      <Route element={<ProtectedGate />}>
        <Route element={<TeacherGate />}>
          <Route
            element={
              <LazyRoute label={t('routes.panelLoading')}>
                <TeacherLayout />
              </LazyRoute>
            }
          >
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route
              path="/app/dashboard"
              element={
                <LazyRoute label={t('routes.dashboardLoading')}>
                  <DashboardPage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/classes"
              element={
                <LazyRoute label="Classes loading">
                  <ClassesPage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/messenger"
              element={
                <LazyRoute label={t('routes.messengerLoading')}>
                  <MessengerPage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/calendar"
              element={
                <LazyRoute label={t('routes.calendarLoading')}>
                  <CalendarPage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/database"
              element={
                <LazyRoute label={t('routes.databaseLoading')}>
                  <DatabasePage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/attendance"
              element={
                <LazyRoute label={t('routes.attendanceLoading')}>
                  <AttendancePage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/generator"
              element={
                <LazyRoute label={t('routes.generatorLoading')}>
                  <GeneratorPage />
                </LazyRoute>
              }
            />
            <Route path="/app/history" element={<Navigate to="/app/messenger" replace />} />
            <Route
              path="/app/history/:id"
              element={
                <LazyRoute label={t('routes.detailLoading')}>
                  <ContentDetailPage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <LazyRoute label={t('routes.settingsLoading')}>
                  <SettingsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/app/billing"
              element={
                <LazyRoute label={t('routes.billingLoading')}>
                  <BillingPage />
                </LazyRoute>
              }
            />
          </Route>
        </Route>

        <Route element={<AdminGate />}>
          <Route
            element={
              <LazyRoute label={t('routes.adminLoading')}>
                <AdminLayout />
              </LazyRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
            path="/admin/dashboard"
            element={
              <LazyRoute label={t('routes.dashboardLoading')}>
                <AdminDashboardPage />
              </LazyRoute>
            }
            />
            <Route
            path="/admin/teachers"
            element={
              <LazyRoute label={t('routes.databaseLoading')}>
                <AdminTeachersPage />
              </LazyRoute>
            }
            />
            <Route
            path="/admin/analytics/usage"
            element={
              <LazyRoute label={t('routes.databaseLoading')}>
                <AdminUsageAnalyticsPage />
              </LazyRoute>
            }
            />
            <Route
            path="/admin/analytics/features"
            element={
              <LazyRoute label={t('routes.databaseLoading')}>
                <AdminFeatureAnalyticsPage />
              </LazyRoute>
            }
            />
            <Route
            path="/admin/subscriptions"
            element={
              <LazyRoute label={t('routes.billingLoading')}>
                <AdminSubscriptionsPage />
              </LazyRoute>
            }
            />
            <Route
            path="/admin/activity"
            element={
              <LazyRoute label={t('routes.messengerLoading')}>
                <AdminActivityPage />
              </LazyRoute>
            }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
