import { Outlet, Link } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useAuth } from '@/hooks/use-auth'

export function PublicLayout() {
  const { session, profile, logout } = useAuth()
  const panelHref = profile?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'
  const panelLabel = profile?.role === 'admin' ? 'Admin panel' : 'Panel'

  return (
    <div className="min-h-screen selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-tr from-primary to-primary/80 text-white shadow-lg shadow-primary/25 transition-transform group-hover:rotate-6">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="hidden flex-col sm:flex">
              <div className="text-lg font-black tracking-tight leading-none text-foreground">Teacher Assistant</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 mt-1">AI Smart Workspace</div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 md:gap-8">
            <Link to="/pricing" className="hidden text-sm font-bold text-muted-foreground transition-colors hover:text-primary md:block uppercase tracking-wider">
              Narxlar
            </Link>
            {session ? (
              <div className="flex items-center gap-3">
                <Button asChild size="sm" variant="gradient" className="h-10 px-5 rounded-xl font-bold">
                  <Link to={panelHref}>{panelLabel}</Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-border/40"
                  onClick={async () => {
                    await logout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden text-sm font-bold text-muted-foreground transition-colors hover:text-primary sm:block uppercase tracking-wider px-4">
                  Kirish
                </Link>
                <Button asChild size="sm" variant="gradient" className="h-10 px-6 rounded-xl font-bold shadow-glow">
                  <Link to="/register">Bepul boshlash</Link>
                </Button>
              </div>
            )}
            <div className="pl-2 border-l border-white/10">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
      <main className="animate-in">
        <Outlet />
      </main>
    </div>
  )
}
