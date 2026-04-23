import { Bot, CreditCard, History, LayoutDashboard, Sparkles, UserCircle2 } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app/dashboard', label: 'Asosiy', icon: LayoutDashboard },
  { to: '/app/generator', label: 'Yaratish', icon: Sparkles },
  { to: '/app/history', label: 'Tarix', icon: History },
  { to: '/app/billing', label: 'Tarif', icon: CreditCard },
]

export function TeacherLayout() {
  return (
    <div className="app-shell teacher-shell selection:bg-primary/20 selection:text-primary">
      <header className="mb-6 flex items-center justify-between px-4 animate-in sm:px-0">
        <Badge variant="gradient" className="h-8 px-3 text-[10px]">Teacher panel</Badge>
        <div className="flex items-center justify-end gap-3">
          <Link to="/app/settings" className="hidden items-center gap-2 rounded-2xl border border-border/40 bg-card/50 px-4 py-2.5 text-sm font-bold text-foreground backdrop-blur-sm transition-all hover:border-primary/30 sm:flex">
            <Bot className="h-4 w-4 text-primary" />
            Telegram
          </Link>
          <Link
            to="/app/settings"
            aria-label="Profil sozlamalari"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-white shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
          >
            <UserCircle2 className="h-7 w-7" />
          </Link>
        </div>
      </header>

      <main className="animate-in [animation-delay:100ms]">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex items-center justify-around border-t border-white/30 bg-white/85 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_48px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/75 sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:rounded-[32px] sm:border sm:p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-14 flex-1 flex-col items-center justify-center rounded-2xl transition-all duration-300 sm:w-20 sm:flex-none',
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground/60 hover:bg-secondary/80 hover:text-foreground',
              )
            }
          >
            <item.icon className={cn("h-6 w-6 transition-transform duration-300 group-active:scale-90")} />
            <span className="mt-1 text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
