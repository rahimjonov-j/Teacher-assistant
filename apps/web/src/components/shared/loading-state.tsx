import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
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
      <Spinner className="size-10 text-primary" aria-label={label || t('common.loading')} />
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
        'overflow-hidden border-border/70 bg-card shadow-[0_28px_70px_-48px_rgba(15,23,42,0.18)]',
        className,
      )}
    >
      <CardContent className="space-y-6 p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-[20px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-3.5 w-60 rounded-full" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-border/70 bg-secondary/40 p-5">
            <div className="space-y-3">
              <Skeleton className="h-4 w-[78%] rounded-full" />
              <Skeleton className="h-4 w-[96%] rounded-full" />
            </div>
          </div>

          <div className="space-y-5 rounded-[30px] border border-border bg-card p-6">
            <Skeleton className="h-14 w-full rounded-[24px]" />
            <Skeleton className="h-36 w-full rounded-[28px]" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-14 w-full rounded-[24px]" />
              <Skeleton className="h-14 w-full rounded-[24px]" />
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
      <Spinner className="size-4" />
      {children}
    </>
  )
}
