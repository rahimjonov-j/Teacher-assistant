import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  ChevronRight,
  CreditCard,
  Layers3,
  LineChart,
  LogOut,
  Menu,
  X,
  Users,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/dashboard', labelKey: 'admin.layout.overview', icon: BarChart3 },
  { to: '/admin/teachers', labelKey: 'admin.layout.users', icon: Users },
  { to: '/admin/analytics/usage', labelKey: 'admin.layout.usage', icon: LineChart },
  { to: '/admin/analytics/features', labelKey: 'admin.layout.features', icon: Layers3 },
  { to: '/admin/subscriptions', labelKey: 'admin.layout.subscriptions', icon: CreditCard },
  { to: '/admin/activity', labelKey: 'admin.layout.activity', icon: Activity },
]

function lockBodyScroll(enabled: boolean) {
  if (!enabled) {
    return undefined
  }

  const scrollY = window.scrollY
  const originalBodyStyle = {
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  }

  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'

  return () => {
    document.body.style.position = originalBodyStyle.position
    document.body.style.top = originalBodyStyle.top
    document.body.style.width = originalBodyStyle.width
    document.body.style.overflow = originalBodyStyle.overflow
    window.scrollTo(0, scrollY)
  }
}

function AdminSidebarContent({
  onClose,
  onNavigate,
  onLogout,
}: {
  onClose?: () => void
  onNavigate?: () => void
  onLogout: () => Promise<void>
}) {
  const { t } = useI18n()

  return (
    <div className="flex h-full min-h-0 flex-col bg-card px-4 pb-6 pt-5">
      <div className="flex items-center justify-between px-2">
        <Link to="/admin/dashboard" onClick={onNavigate} className="min-w-0">
          <div className="truncate text-sm font-black tracking-tight">{t('admin.layout.controlPanel')}</div>
          <div className="truncate text-xs text-muted-foreground">{t('admin.layout.systemAnalytics')}</div>
        </Link>
        {onClose ? (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose} aria-label="Close admin menu">
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', isActive ? 'bg-background' : 'bg-secondary')}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="truncate">{t(item.labelKey)}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <Link
          to="/app/dashboard"
          onClick={onNavigate}
          className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-4 transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Switch</div>
              <div className="mt-1 text-sm font-bold text-foreground">{t('admin.layout.teacherApp')}</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" className="h-11 flex-1 justify-start" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            {t('common.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => lockBodyScroll(drawerOpen), [drawerOpen])

  const handleLogout = async () => {
    setDrawerOpen(false)
    await logout()
  }

  return (
    <div className="min-h-screen bg-background selection:bg-sky-500/20 selection:text-sky-500">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-40 shadow-lg lg:hidden"
        onClick={() => setDrawerOpen(true)}
        aria-label="Admin menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/25 backdrop-blur-[1px] lg:hidden" onClick={() => setDrawerOpen(false)}>
          <aside
            className="h-[100dvh] w-[84%] max-w-[320px] rounded-r-2xl border-r border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebarContent onClose={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-4 left-4 z-30 hidden w-[320px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-42px_rgba(0,0,0,0.25)] lg:block">
        <AdminSidebarContent onLogout={handleLogout} />
      </aside>

      <main className="min-h-screen px-4 pb-8 pt-20 lg:pl-[368px] lg:pr-8 lg:pt-8">
        <div className="mx-auto w-full max-w-[1160px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
