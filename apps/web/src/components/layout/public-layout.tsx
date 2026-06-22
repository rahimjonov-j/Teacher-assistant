import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '@/hooks/use-i18n'

function BrandMark() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c6f833] shadow-[0_0_24px_-4px_rgba(198,248,51,0.55)]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" />
      </svg>
    </span>
  )
}

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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] text-white">
      {/* lime glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[520px] w-[820px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse at center, rgba(198,248,51,0.14), transparent 62%)', filter: 'blur(8px)' }}
      />
      {/* grid lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 55% at 50% 18%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 18%, black, transparent 80%)',
        }}
      />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
        <Link to="/" className="mx-auto flex items-center gap-3 py-2">
          <BrandMark />
          <div>
            <div className="text-sm font-bold tracking-tight text-white">Teacher Assistant</div>
            <div className="text-[11px] font-medium text-white/45">{t('public.mobileWorkspace')}</div>
          </div>
        </Link>
        <div className="flex flex-1 items-center justify-center py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
