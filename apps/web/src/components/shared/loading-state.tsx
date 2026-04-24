import { LoaderCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

export function FullScreenLoader({
  label = 'Yuklanmoqda',
}: {
  label?: string
}) {
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" aria-label={label || t('common.loading')} />
    </div>
  )
}

export function CardLoader({
  className,
}: {
  className?: string
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden border-white/70 bg-white/80 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55',
        className,
      )}
    >
      <CardContent className="relative space-y-6 overflow-hidden p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.45)_18%,transparent_36%)] opacity-70 telegram-loader-sheen dark:bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_18%,transparent_36%)]" />

        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-[20px] bg-sky-100 dark:bg-sky-500/10" />
          <div className="space-y-2">
            <div className="telegram-loader-line h-4 w-40 rounded-full" />
            <div className="telegram-loader-line h-3.5 w-60 rounded-full" />
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="rounded-[24px] border border-white/70 bg-white/75 p-5 dark:border-white/10 dark:bg-slate-950/40">
            <div className="space-y-3">
              <div className="telegram-loader-line h-4 w-[78%] rounded-full" />
              <div className="telegram-loader-line h-4 w-[96%] rounded-full" />
            </div>
          </div>

          <div className="telegram-loader-panel space-y-5 rounded-[30px] p-6">
            <div className="telegram-loader-line h-14 w-full rounded-[24px]" />
            <div className="telegram-loader-line h-36 w-full rounded-[28px]" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="telegram-loader-line h-14 w-full rounded-[24px]" />
              <div className="telegram-loader-line h-14 w-full rounded-[24px]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ButtonLoader({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {children}
    </>
  )
}
