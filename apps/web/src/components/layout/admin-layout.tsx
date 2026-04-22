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
      <header className="mb-10 overflow-hidden rounded-[32px] border border-border/70 bg-white/90 text-slate-900 shadow-xl animate-in dark:border-white/5 dark:bg-[#0a0c10] dark:text-slate-100 dark:shadow-2xl dark:shadow-black/50">
        <div className="border-b border-slate-200/80 px-6 py-8 dark:border-white/5 sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="gradient" className="bg-sky-500 text-white border-none text-[10px] h-6 px-3">ADMIN</Badge>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Control Panel</span>
              </div>
              <div>
                <Link to="/admin/dashboard" className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
                    <BarChart3 className="h-6 w-6 text-sky-400" />
                  </div>
                  System Analytics
                </Link>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-600 dark:text-slate-400">
                  Monitoring user activity, subscriptions, and AI service health in real-time.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="h-11 rounded-2xl border-border/70 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                <Link to="/app/dashboard">
                  <ArrowRightLeft className="h-4 w-4 text-sky-400" />
                  Teacher App
                </Link>
              </Button>
              <div className="mx-1 h-8 w-[1px] bg-slate-200 dark:bg-white/5" />
              <ThemeToggle />
              <Button
                variant="outline"
                className="h-11 w-11 rounded-2xl border-border/70 bg-white/80 text-slate-500 hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
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

        <div className="flex flex-wrap gap-2 bg-slate-50/90 px-6 py-4 dark:bg-white/[0.02] sm:px-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-bold transition-all duration-300',
                  isActive 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="animate-in [animation-delay:150ms]">
        <Outlet />
      </main>
    </div>
  )
}
