import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: string | number
  hint: string
  icon?: LucideIcon
}

export const StatCard = memo(function StatCard({
  label,
  value,
  hint,
  icon: Icon = ArrowUpRight,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden bg-card/85">
      <div className="absolute right-[-10%] top-[-20%] h-32 w-32 rounded-full bg-primary/6 blur-3xl" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
            <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary shadow-sm">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
          <p className="text-xs font-medium text-muted-foreground/60">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
})
