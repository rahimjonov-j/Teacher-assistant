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
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
          <p className="text-xs font-medium text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
})
