import { Link, Outlet, useLocation } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

export function PublicLayout() {
  const { t } = useI18n()
  const location = useLocation()

  if (location.pathname === '/') {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mobile-container flex min-h-screen flex-col py-6">
        <Link to="/login" className="mx-auto flex items-center gap-3 py-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Teacher Assistant</div>
            <div className="text-[11px] font-medium text-muted-foreground">{t('public.mobileWorkspace')}</div>
          </div>
        </Link>
        <div className="flex flex-1 items-center justify-center py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
