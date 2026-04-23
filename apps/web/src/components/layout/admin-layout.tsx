import { Activity, ArrowRightLeft, BarChart3, CreditCard, Layers3, LineChart, LogOut, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/dashboard', label: 'Umumiy', icon: BarChart3 },
  { to: '/admin/teachers', label: 'Foydalanuvchilar', icon: Users },
  { to: '/admin/analytics/usage', label: 'Foydalanish', icon: LineChart },
  { to: '/admin/analytics/features', label: 'Funksiyalar', icon: Layers3 },
  { to: '/admin/subscriptions', label: 'Obunalar', icon: CreditCard },
  { to: '/admin/activity', label: 'Faollik', icon: Activity },
]

export function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="app-shell selection:bg-sky-500/20 selection:text-sky-400">
      <header className="mb-8 overflow-hidden rounded-[32px] border border-border/70 bg-white/90 text-slate-900 shadow-xl animate-in dark:border-white/5 dark:bg-[#0a0c10] dark:text-slate-100 dark:shadow-2xl dark:shadow-black/50 max-sm:rounded-none max-sm:border-0 max-sm:bg-background max-sm:shadow-none max-sm:dark:bg-background">
        <div className="border-b border-slate-200/80 px-6 py-8 dark:border-white/5 sm:px-8 max-sm:border-0 max-sm:px-4 max-sm:py-5">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="gradient" className="h-6 border-none bg-sky-500 px-3 text-[10px] text-white max-sm:bg-secondary max-sm:text-foreground">ADMIN</Badge>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 max-sm:hidden" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 max-sm:hidden">Control Panel</span>
              </div>
              <div>
                <Link to="/admin/dashboard" className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 max-sm:hidden">
                    <BarChart3 className="h-6 w-6 text-sky-400" />
                  </div>
                  System Analytics
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 max-sm:gap-2">
              <Button asChild variant="outline" className="h-11 rounded-2xl border-border/70 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 max-sm:border-0 max-sm:bg-secondary max-sm:shadow-none max-sm:backdrop-blur-none">
                <Link to="/app/dashboard">
                  <ArrowRightLeft className="h-4 w-4 text-sky-400" />
                  Teacher App
                </Link>
              </Button>
              <div className="mx-1 h-8 w-[1px] bg-slate-200 dark:bg-white/5 max-sm:hidden" />
              <ThemeToggle />
              <Button
                variant="outline"
                className="h-11 w-11 rounded-2xl border-border/70 bg-white/80 text-slate-500 hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white max-sm:border-0 max-sm:bg-secondary max-sm:shadow-none max-sm:backdrop-blur-none"
                size="icon"
                onClick={async () => {
                  await logout()
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="animate-in [animation-delay:150ms]">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:mx-auto sm:max-w-2xl sm:rounded-[28px] sm:border sm:p-2">
        <div className="flex items-center gap-1 overflow-x-auto sm:justify-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex h-12 min-w-0 flex-1 items-center justify-center rounded-2xl px-2 text-muted-foreground transition-colors duration-200 sm:h-11 sm:flex-none sm:px-4',
                  isActive
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5 transition-transform duration-200 group-active:scale-90" />
              <span className="sr-only">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
