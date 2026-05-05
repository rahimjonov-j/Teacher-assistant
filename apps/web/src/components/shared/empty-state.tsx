import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <Card className="border-dashed border-2 bg-card/70 shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-6 p-12 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-primary">
          {Icon ? <Icon className="h-10 w-10" /> : <div className="h-10 w-10 border-2 border-current rounded-full opacity-20" />}
        </div>
        <div className="max-w-xs space-y-2">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
