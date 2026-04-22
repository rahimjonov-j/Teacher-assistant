import { LoaderCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function FullScreenLoader({
  label = 'Yuklanmoqda',
}: {
  label?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" aria-label={label} />
    </div>
  )
}

export function CardLoader({
  className,
}: {
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden border-none bg-secondary/30 shadow-none', className)}>
      <CardContent className="space-y-6 p-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary/10" />
          <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-32 w-full animate-pulse rounded-[24px] bg-muted/40" />
          <div className="flex gap-3">
            <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-muted/60" />
            <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-muted/60" />
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
