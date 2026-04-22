import { LoaderCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function FullScreenLoader({
  label = 'Yuklanmoqda',
}: {
  label?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background/30 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-[32px] border border-white/20 bg-white/40 p-12 text-center shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/40">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative rounded-3xl bg-gradient-to-tr from-primary to-primary/80 p-5 text-white shadow-lg shadow-primary/30">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-lg font-bold tracking-tight text-foreground">{label}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-6 animate-pulse rounded-full bg-primary/60" />
            <span className="h-1.5 w-4 animate-pulse rounded-full bg-primary/40 [animation-delay:150ms]" />
            <span className="h-1.5 w-2 animate-pulse rounded-full bg-primary/20 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
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
