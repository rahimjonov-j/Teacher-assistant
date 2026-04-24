import { Activity, ArrowRightLeft, BarChart3, CreditCard, Layers3, LineChart, LogOut, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Badge } from '@/components/ui/badge'
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

export function AdminLayout() {
  const { logout } = useAuth()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background selection:bg-sky-500/20 selection:text-sky-400">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[32px] border border-border/70 bg-white/92 p-4 shadow-xl lg:flex">
          <div className="border-b border-border/70 px-3 pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight">{t('admin.layout.controlPanel')}</div>
                <div className="text-xs text-muted-foreground">{t('admin.layout.systemAnalytics')}</div>
              </div>
            </div>
          </div>
          <nav className="mt-4 flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors',
                    isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', isActive ? 'bg-background/10' : 'bg-secondary')}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span>{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-3 border-t border-border/70 px-2 pt-4">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/app/dashboard">
                <ArrowRightLeft className="h-4 w-4" />
                {t('admin.layout.teacherApp')}
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                className="flex-1 justify-start"
                onClick={async () => {
                  await logout()
                }}
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-6 overflow-hidden rounded-[32px] border border-border/70 bg-white/92 shadow-xl animate-in">
            <div className="border-b border-border/70 px-5 py-6 sm:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="gradient" className="h-6 border-none bg-foreground px-3 text-[10px] text-background">
                      ADMIN
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {t('admin.layout.controlPanel')}
                    </span>
                  </div>
                  <Link to="/admin/dashboard" className="flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary lg:hidden">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    {t('admin.layout.systemAnalytics')}
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="outline" className="h-11 rounded-2xl">
                    <Link to="/app/dashboard">
                      <ArrowRightLeft className="h-4 w-4" />
                      {t('admin.layout.teacherApp')}
                    </Link>
                  </Button>
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl"
                    onClick={async () => {
                      await logout()
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.logout')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-4 py-4 lg:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors',
                      isActive ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-accent',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          </header>

          <main className="animate-in [animation-delay:150ms]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
