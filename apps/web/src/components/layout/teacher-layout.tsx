import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Database,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const drawerNavItems = [
  { to: '/app/dashboard', labelKey: 'teacher.nav.dashboard', icon: LayoutDashboard },
  { to: '/app/classes', labelKey: 'teacher.nav.classes', icon: GraduationCap },
  { to: '/app/messenger', labelKey: 'teacher.nav.messenger', icon: MessageSquare },
  { to: '/app/calendar', labelKey: 'teacher.nav.calendar', icon: CalendarDays },
  { to: '/app/database', labelKey: 'teacher.nav.database', icon: Database },
  { to: '/app/attendance', labelKey: 'teacher.nav.attendance', icon: ClipboardCheck },
  { to: '/app/settings', labelKey: 'teacher.nav.settings', icon: Settings },
  { to: '/app/billing', labelKey: 'teacher.menu.plans', icon: CreditCard },
] as const

const bottomNavItems = [
  { to: '/app/dashboard', labelKey: 'teacher.nav.dashboard', icon: LayoutDashboard, pattern: '/app/dashboard' },
  { to: '/app/classes', labelKey: 'teacher.nav.classes', icon: GraduationCap, pattern: '/app/classes' },
  { to: '/app/generator', labelKey: 'teacher.header.create', icon: Sparkles, pattern: '/app/generator', isAction: true },
  { to: '/app/messenger', labelKey: 'teacher.nav.messenger', icon: MessageSquare, pattern: '/app/messenger' },
  { to: '/app/settings', labelKey: 'teacher.nav.settings', icon: Settings, pattern: '/app/settings' },
] as const

const featureTones: Record<string, string> = {
  quiz: 'bg-primary/10 text-primary',
  lesson_plan: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  writing_feedback: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  speaking_questions: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  pdf_export: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}
export { featureTones }

const pageMeta: Array<{ pattern: string; titleKey: string; actionTo?: string }> = [
  { pattern: '/app/dashboard', titleKey: 'teacher.nav.dashboard', actionTo: '/app/generator' },
  { pattern: '/app/classes', titleKey: 'teacher.nav.classes' },
  { pattern: '/app/messenger', titleKey: 'teacher.nav.messenger', actionTo: '/app/generator' },
  { pattern: '/app/calendar', titleKey: 'teacher.nav.calendar', actionTo: '/app/generator' },
  { pattern: '/app/database', titleKey: 'teacher.nav.database', actionTo: '/app/generator' },
  { pattern: '/app/attendance', titleKey: 'teacher.nav.attendance', actionTo: '/app/generator' },
  { pattern: '/app/settings', titleKey: 'teacher.nav.settings' },
  { pattern: '/app/generator', titleKey: 'teacher.header.create' },
  { pattern: '/app/history', titleKey: 'teacher.nav.messenger' },
  { pattern: '/app/history/:id', titleKey: 'teacher.header.detail' },
  { pattern: '/app/billing', titleKey: 'teacher.menu.plans' },
] as const

export function TeacherLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout, profile } = useAuth()
  const { t } = useI18n()

  const currentPage = useMemo(
    () => pageMeta.find((item) => matchPath({ path: item.pattern, end: true }, location.pathname)) ?? pageMeta[0],
    [location.pathname],
  )

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'T'

  useEffect(() => {
    if (!drawerOpen) return
    const scrollY = window.scrollY
    const prev = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow }
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = prev.position
      document.body.style.top = prev.top
      document.body.style.width = prev.width
      document.body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [drawerOpen])

  const handleLogout = async () => {
    setDrawerOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Drawer overlay */}
      {drawerOpen ? (
        <div
          data-no-swipe-back
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            data-no-swipe-back
            className="flex h-[100dvh] w-[84%] max-w-[300px] flex-col overflow-hidden rounded-r-[2rem] border-r border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 px-5 pb-5 pt-5">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,248,51,0.16),transparent_60%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c6f833] text-sm font-black text-[#0a0a0c]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">{profile?.fullName ?? 'Teacher'}</div>
                    <div className="truncate text-[11px] text-white/60">{profile?.schoolName ?? t('teacher.menu.workspace')}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white hover:bg-white/20 hover:text-white"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
              {drawerNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                      {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-border px-3 pb-5 pt-3">
              <Button
                variant="ghost"
                className="h-10 w-full justify-start gap-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* App shell */}
      <div className="app-shell">
        {/* Top bar */}
        <header className="app-topbar">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-foreground transition-colors hover:bg-muted"
            onClick={() => setDrawerOpen(true)}
          >
            <div className="flex flex-col gap-[5px]">
              <span className="h-[2px] w-5 rounded-full bg-current" />
              <span className="h-[2px] w-3.5 rounded-full bg-current" />
              <span className="h-[2px] w-5 rounded-full bg-current" />
            </div>
          </button>

          <div className="min-w-0 text-center">
            <div className="truncate text-[11px] font-semibold text-muted-foreground">
              Teacher Assistant
            </div>
            <div className="truncate text-sm font-black tracking-tight">
              {t(currentPage.titleKey)}
            </div>
          </div>

          {currentPage.actionTo ? (
            <Link
              to={currentPage.actionTo}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c6f833] text-[#0a0a0c] shadow-[0_4px_14px_-4px_rgba(198,248,51,0.6)]"
            >
              <Sparkles className="h-4.5 w-4.5" />
            </Link>
          ) : (
            <div className="h-10 w-10" />
          )}
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav */}
      {!drawerOpen ? (
        <nav className="app-bottom-nav">
          {bottomNavItems.map((item) => {
            const isActive = Boolean(matchPath({ path: item.pattern, end: false }, location.pathname))
            const isAction = 'isAction' in item && item.isAction

            if (isAction) {
              return (
                <NavLink key={item.to} to={item.to} className="app-nav-item">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c6f833] text-[#0a0a0c] transition-all duration-200',
                    isActive
                      ? 'scale-105 shadow-[0_6px_20px_-4px_rgba(198,248,51,0.7)]'
                      : 'shadow-[0_4px_14px_-6px_rgba(198,248,51,0.5)]',
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn('app-nav-item', isActive && 'app-nav-item-active')}
              >
                <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-[10px] font-semibold transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {t(item.labelKey)}
                </span>
              </NavLink>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
