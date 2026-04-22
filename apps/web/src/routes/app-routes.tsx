import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/admin-layout'
import { FullScreenLoader } from '@/components/shared/loading-state'
import { PublicLayout } from '@/components/layout/public-layout'
import { TeacherLayout } from '@/components/layout/teacher-layout'
import { useAuth } from '@/hooks/use-auth'

const LandingPage = lazy(async () => ({
  default: (await import('@/pages/public/landing-page')).LandingPage,
}))
const PricingPage = lazy(async () => ({
  default: (await import('@/pages/public/pricing-page')).PricingPage,
}))
const LoginPage = lazy(async () => ({
  default: (await import('@/pages/public/login-page')).LoginPage,
}))
const RegisterPage = lazy(async () => ({
  default: (await import('@/pages/public/register-page')).RegisterPage,
}))
const DashboardPage = lazy(async () => ({
  default: (await import('@/pages/app/dashboard-page')).DashboardPage,
}))
const GeneratorPage = lazy(async () => ({
  default: (await import('@/pages/app/generator-page')).GeneratorPage,
}))
const HistoryPage = lazy(async () => ({
  default: (await import('@/pages/app/history-page')).HistoryPage,
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

function LazyRoute({ children, label = 'Sahifa yuklanmoqda' }: { children: ReactNode; label?: string }) {
  return <Suspense fallback={<FullScreenLoader label={label} />}>{children}</Suspense>
}

function ProtectedGate() {
  const { session, profile, loading } = useAuth()

  if (loading || (session && !profile)) {
    return <FullScreenLoader label="Panel ochilmoqda" />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function AdminGate() {
  const { session, profile, loading } = useAuth()

  if (loading || (session && !profile)) {
    return <FullScreenLoader label="Admin panel ochilmoqda" />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}

function GuestGate() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <FullScreenLoader label="Hisob tekshirilmoqda" />
  }

  if (session) {
    if (!profile) {
      return <FullScreenLoader label="Yo'naltirilmoqda" />
    }

    return <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <LazyRoute label="Bosh sahifa yuklanmoqda">
              <LandingPage />
            </LazyRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <LazyRoute label="Tariflar yuklanmoqda">
              <PricingPage />
            </LazyRoute>
          }
        />
        <Route element={<GuestGate />}>
          <Route
            path="/login"
            element={
              <LazyRoute label="Kirish sahifasi yuklanmoqda">
                <LoginPage />
              </LazyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <LazyRoute label="Ro'yxatdan o'tish yuklanmoqda">
                <RegisterPage />
              </LazyRoute>
            }
          />
        </Route>
      </Route>

      <Route element={<ProtectedGate />}>
        <Route element={<TeacherLayout />}>
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route
            path="/app/dashboard"
            element={
              <LazyRoute label="Dashboard yuklanmoqda">
                <DashboardPage />
              </LazyRoute>
            }
          />
          <Route
            path="/app/generator"
            element={
              <LazyRoute label="Generator yuklanmoqda">
                <GeneratorPage />
              </LazyRoute>
            }
          />
          <Route
            path="/app/history"
            element={
              <LazyRoute label="Tarix yuklanmoqda">
                <HistoryPage />
              </LazyRoute>
            }
          />
          <Route
            path="/app/history/:id"
            element={
              <LazyRoute label="Material yuklanmoqda">
                <ContentDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <LazyRoute label="Sozlamalar yuklanmoqda">
                <SettingsPage />
              </LazyRoute>
            }
          />
          <Route
            path="/app/billing"
            element={
              <LazyRoute label="To'lov sahifasi yuklanmoqda">
                <BillingPage />
              </LazyRoute>
            }
          />
        </Route>

        <Route element={<AdminGate />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <LazyRoute label="Admin dashboard yuklanmoqda">
                  <AdminDashboardPage />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <LazyRoute label="O'qituvchilar ro'yxati yuklanmoqda">
                  <AdminTeachersPage />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/analytics/usage"
              element={
                <LazyRoute label="Usage analytics yuklanmoqda">
                  <AdminUsageAnalyticsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/analytics/features"
              element={
                <LazyRoute label="Feature analytics yuklanmoqda">
                  <AdminFeatureAnalyticsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <LazyRoute label="Obunalar yuklanmoqda">
                  <AdminSubscriptionsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <LazyRoute label="Faollik sahifasi yuklanmoqda">
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
