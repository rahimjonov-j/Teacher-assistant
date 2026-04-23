import { CreditCard, History, LayoutDashboard, Sparkles, UserCircle2 } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
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
      <header className="mb-4 flex items-center justify-between px-4 py-2 animate-in sm:px-0 sm:py-0">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Teacher Assistant</div>
          <div className="mt-1 text-xl font-black tracking-tight">Ish paneli</div>
        </div>
        <Link
          to="/app/settings"
          aria-label="Profil sozlamalari"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-muted active:scale-95"
        >
          <UserCircle2 className="h-6 w-6" />
        </Link>
      </header>

      <main className="animate-in [animation-delay:100ms]">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex items-center justify-around border-t border-border/60 bg-background/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:rounded-[28px] sm:border sm:p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-14 flex-1 flex-col items-center justify-center rounded-2xl transition-colors duration-200 sm:w-20 sm:flex-none',
                isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            <item.icon className={cn("h-5 w-5 transition-transform duration-200 group-active:scale-90")} />
            <span className="mt-1 text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
