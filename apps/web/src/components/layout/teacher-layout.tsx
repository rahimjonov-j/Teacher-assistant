import { Bot, CreditCard, History, LayoutDashboard, LogOut, Sparkles, UserCircle2 } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app/dashboard', label: 'Asosiy', icon: LayoutDashboard },
  { to: '/app/generator', label: 'Yaratish', icon: Sparkles },
  { to: '/app/history', label: 'Tarix', icon: History },
  { to: '/app/billing', label: 'Tarif', icon: CreditCard },
  { to: '/app/settings', label: 'Sozlamalar', icon: UserCircle2 },
]

export function TeacherLayout() {
  const { profile, logout } = useAuth()

  return (
    <div className="app-shell selection:bg-primary/20 selection:text-primary">
      <header className="mb-10 flex flex-col gap-4 animate-in sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
            <UserCircle2 className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-black tracking-tight leading-none">{profile?.fullName ?? "O'qituvchi"}</h2>
              <Badge variant="gradient" className="h-5 px-2 text-[9px]">PRO</Badge>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-muted-foreground/60">{profile?.email}</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <Link to="/app/settings" className="hidden items-center gap-2 rounded-2xl border border-border/40 bg-card/50 px-4 py-2.5 text-sm font-bold text-foreground backdrop-blur-sm transition-all hover:border-primary/30 sm:flex">
            <Bot className="h-4 w-4 text-primary" />
            Telegram
          </Link>
          <div className="h-10 w-[1px] bg-border/40 mx-1 hidden sm:block" />
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/30"
            aria-label="Chiqish"
            onClick={async () => {
              await logout()
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="animate-in [animation-delay:100ms]">
        <Outlet />
      </main>

      <nav className="fixed inset-x-6 bottom-8 z-50 mx-auto flex max-w-lg items-center justify-around rounded-[32px] border border-white/20 bg-white/60 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/60 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-14 w-14 flex-col items-center justify-center rounded-2xl transition-all duration-300',
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground/60 hover:bg-secondary/80 hover:text-foreground',
              )
            }
          >
            <item.icon className={cn("h-6 w-6 transition-transform duration-300 group-active:scale-90")} />
            <span className="sr-only">{item.label}</span>
            {/* Tooltip for desktop could go here */}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
