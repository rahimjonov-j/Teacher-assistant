import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  hint: string
  icon?: LucideIcon
  tone?: 'primary' | 'violet' | 'emerald' | 'orange' | 'slate'
}

export const StatCard = memo(function StatCard({
  label,
  value,
  hint,
  icon: Icon = ArrowUpRight,
  tone = 'primary',
}: StatCardProps) {
  const toneClassName = {
    primary: 'bg-primary/10 text-primary ring-1 ring-primary/15',
    violet: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/80',
    slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  }[tone]

  return (
    <Card className="h-full min-w-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_64px_-44px_rgba(30,41,88,0.28)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="break-words text-xl font-black tracking-tight text-foreground">{value}</p>
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11', toneClassName)}>
            <Icon className="h-5 w-5 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
          <p className="min-w-0 break-words text-xs font-medium text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
})
