import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  CreditCard,
  Layers3,
  LineChart,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-primary via-primary/90 to-violet-700 px-5 pb-5 pt-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <Link to="/admin/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black tracking-tight text-white">
                {t('admin.layout.controlPanel')}
              </div>
              <div className="truncate text-[11px] font-medium text-white/60">
                {t('admin.layout.systemAnalytics')}
              </div>
            </div>
          </Link>
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/20 hover:text-white"
              onClick={onClose}
              aria-label="Close admin menu"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted/80',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-border px-3 pb-4 pt-3">
        <Link
          to="/app/dashboard"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3 transition-all hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/20">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Switch</div>
            <div className="text-sm font-semibold text-foreground">{t('admin.layout.teacherApp')}</div>
          </div>
          <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="h-10 flex-1 justify-start gap-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onLogout}
          >
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
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => lockBodyScroll(drawerOpen), [drawerOpen])

  const handleLogout = async () => {
    setDrawerOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
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
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="h-[100dvh] w-[84%] max-w-[300px] overflow-hidden rounded-r-[2rem] border-r border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebarContent
              onClose={() => setDrawerOpen(false)}
              onNavigate={() => setDrawerOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-4 left-4 z-30 hidden w-[280px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] lg:block">
        <AdminSidebarContent onLogout={handleLogout} />
      </aside>

      <main className="min-h-screen px-4 pb-8 pt-20 lg:pl-[320px] lg:pr-8 lg:pt-8">
        <div className="mx-auto w-full max-w-[1160px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
