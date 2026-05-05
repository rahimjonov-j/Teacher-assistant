import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Database,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app/dashboard', labelKey: 'teacher.nav.dashboard', icon: LayoutDashboard },
  { to: '/app/classes', labelKey: 'teacher.nav.classes', icon: GraduationCap },
  { to: '/app/messenger', labelKey: 'teacher.nav.messenger', icon: MessageSquare },
  { to: '/app/calendar', labelKey: 'teacher.nav.calendar', icon: CalendarDays },
  { to: '/app/database', labelKey: 'teacher.nav.database', icon: Database },
  { to: '/app/attendance', labelKey: 'teacher.nav.attendance', icon: ClipboardCheck },
  { to: '/app/telegram-link', labelKey: 'teacher.nav.telegramLink', icon: KeyRound },
  { to: '/app/settings', labelKey: 'teacher.nav.settings', icon: Settings },
  { to: '/app/billing', labelKey: 'teacher.menu.plans', icon: CreditCard },
] as const

const bottomNavItems = [
  { to: '/app/dashboard', labelKey: 'teacher.nav.dashboard', icon: LayoutDashboard, pattern: '/app/dashboard' },
  { to: '/app/generator', labelKey: 'teacher.header.create', icon: Sparkles, pattern: '/app/generator' },
  { to: '/app/classes', labelKey: 'teacher.nav.classes', icon: GraduationCap, pattern: '/app/classes' },
  { to: '/app/messenger', labelKey: 'teacher.nav.messenger', icon: MessageSquare, pattern: '/app/messenger' },
  { to: '/app/settings', labelKey: 'teacher.nav.settings', icon: UserRound, pattern: '/app/settings' },
] as const

const pageMeta: Array<{ pattern: string; titleKey: string; actionTo?: string }> = [
  { pattern: '/app/dashboard', titleKey: 'teacher.nav.dashboard', actionTo: '/app/generator' },
  { pattern: '/app/classes', titleKey: 'teacher.nav.classes' },
  { pattern: '/app/messenger', titleKey: 'teacher.nav.messenger', actionTo: '/app/generator' },
  { pattern: '/app/calendar', titleKey: 'teacher.nav.calendar', actionTo: '/app/generator' },
  { pattern: '/app/database', titleKey: 'teacher.nav.database', actionTo: '/app/generator' },
  { pattern: '/app/attendance', titleKey: 'teacher.nav.attendance', actionTo: '/app/generator' },
  { pattern: '/app/telegram-link', titleKey: 'teacher.nav.telegramLink' },
  { pattern: '/app/settings', titleKey: 'teacher.nav.settings' },
  { pattern: '/app/generator', titleKey: 'teacher.header.create' },
  { pattern: '/app/history', titleKey: 'teacher.nav.messenger' },
  { pattern: '/app/history/:id', titleKey: 'teacher.header.detail' },
  { pattern: '/app/billing', titleKey: 'teacher.menu.plans' },
] as const

export function TeacherLayout() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout, profile } = useAuth()
  const { t } = useI18n()

  const currentPage = useMemo(
    () => pageMeta.find((item) => matchPath({ path: item.pattern, end: true }, location.pathname)) ?? pageMeta[0],
    [location.pathname],
  )

  useEffect(() => {
    if (!drawerOpen) {
      return
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
  }, [drawerOpen])

  return (
    <div className="relative min-h-screen bg-background">
      {drawerOpen ? (
        <div data-no-swipe-back className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-[1px]" onClick={() => setDrawerOpen(false)}>
          <aside
            data-no-swipe-back
            className="flex h-[100dvh] w-[86%] max-w-[330px] flex-col rounded-r-[2rem] border-r border-white/70 bg-card/95 px-4 pb-6 pt-5 shadow-2xl backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2">
              <div>
                <div className="text-sm font-black tracking-tight">Teacher Assistant</div>
                <div className="text-xs text-muted-foreground">{t('teacher.menu.workspace')}</div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                      isActive ? 'bg-primary text-primary-foreground shadow-[0_16px_36px_-24px_hsl(var(--primary)/0.8)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', isActive ? 'bg-white/18' : 'bg-secondary')}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span>{t(item.labelKey)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 space-y-3 border-t border-border pb-3 pt-4">
              <Button
                variant="outline"
                className="h-12 w-full justify-start"
                onClick={async () => {
                  setDrawerOpen(false)
                  await logout()
                }}
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="app-shell">
        <header className="app-topbar">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 text-center">
            <div className="truncate text-[11px] font-bold text-muted-foreground">
              {profile?.fullName ? profile.fullName.split(' ')[0] : 'Teacher Assistant'}
            </div>
            <div className="truncate text-sm font-black tracking-tight">
              {t(currentPage.titleKey)}
            </div>
          </div>
          {currentPage.actionTo ? (
            <Button asChild variant="gradient" size="icon" className="rounded-full">
              <Link to={currentPage.actionTo}>
                <Sparkles className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <div className="h-10 w-10" />
          )}
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {!drawerOpen ? <nav className="app-bottom-nav">
        {bottomNavItems.map((item) => {
          const isActive = Boolean(matchPath({ path: item.pattern, end: false }, location.pathname))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn('app-nav-item', isActive && 'app-nav-item-active')}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav> : null}
    </div>
  )
}
