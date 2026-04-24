import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/messenger', label: 'Messenger', icon: MessageSquare },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/database', label: 'Database', icon: Database },
  { to: '/app/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/billing', label: 'Plans', icon: CreditCard },
] as const

const pageMeta: Array<{ pattern: string; title: string; actionTo?: string }> = [
  { pattern: '/app/dashboard', title: 'Dashboard', actionTo: '/app/generator' },
  { pattern: '/app/messenger', title: 'Messenger', actionTo: '/app/generator' },
  { pattern: '/app/calendar', title: 'Calendar', actionTo: '/app/generator' },
  { pattern: '/app/database', title: 'Database', actionTo: '/app/generator' },
  { pattern: '/app/attendance', title: 'Attendance', actionTo: '/app/generator' },
  { pattern: '/app/settings', title: 'Settings' },
  { pattern: '/app/generator', title: 'Create' },
  { pattern: '/app/history', title: 'Messenger' },
  { pattern: '/app/history/:id', title: 'Detail' },
  { pattern: '/app/billing', title: 'Plans' },
] as const

export function TeacherLayout() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuth()
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
            className="flex h-[100dvh] w-[84%] max-w-[320px] flex-col rounded-r-2xl border-r border-border bg-card px-4 pb-6 pt-5 shadow-2xl"
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
                      isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', isActive ? 'bg-background' : 'bg-secondary')}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span>{item.label === 'Plans' ? t('teacher.menu.plans') : t(`teacher.nav.${item.label.toLowerCase()}`)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
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
        <header className="sticky top-0 z-40 -mx-4 mb-6 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-black tracking-tight">
              {currentPage.title === 'Create'
                ? t('teacher.header.create')
                : currentPage.title === 'Detail'
                  ? t('teacher.header.detail')
                  : currentPage.title === 'Plans'
                    ? t('teacher.menu.plans')
                  : t(`teacher.nav.${currentPage.title.toLowerCase()}`)}
            </div>
          </div>
          {currentPage.actionTo ? (
            <Button asChild variant="ghost" size="icon" className="rounded-full">
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
    </div>
  )
}
