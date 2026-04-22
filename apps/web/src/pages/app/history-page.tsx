import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, type GeneratedContentRecord } from '@teacher-assistant/shared'
import { Link } from 'react-router-dom'
import { History, Calendar, Zap, ChevronRight, Search } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { formatDate, getFeatureLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

export function HistoryPage() {
  const [search, setSearch] = useState('')
  const [feature, setFeature] = useState('all')

  const queryKey = useMemo(() => ['content-history', search, feature], [feature, search])
  const query = useQuery({
    queryKey,
    queryFn: () =>
      apiRequest<{ items: GeneratedContentRecord[] }>(
        `/teacher/history?search=${encodeURIComponent(search)}&feature=${feature === 'all' ? '' : feature}`,
      ),
  })

  const items = query.data?.items ?? []

  return (
    <div className="space-y-8 animate-in pb-12">
      <PageHeader
        eyebrow="Saqlangan tarix"
        title="Tarix"
        description="Oldingi materiallarga qarang va boshqaring."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="h-12 rounded-2xl pl-11"
          />
        </div>
        <Select
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          className="h-12 w-full rounded-2xl sm:w-56"
        >
          <option value="all">Barcha turdagi</option>
          {FEATURE_DEFINITIONS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-6">
        {items.length > 0 ? (
          <div className="grid gap-4">
            {items.map((item, i) => (
              <Link key={item.id} to={`/app/history/${item.id}`}>
                <Card className="relative overflow-hidden bg-card/85">
                  <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                    <div className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm',
                      i % 2 === 0
                        ? 'border-primary/10 bg-primary/10 text-primary'
                        : 'border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    )}>
                      <History className="h-7 w-7" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold tracking-tight">{item.title}</h3>
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] border-border/40 font-bold uppercase tracking-widest">
                          {getFeatureLabel(item.featureKey)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          {item.creditsConsumed} kredit
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <ChevronRight className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tarix hali bo'sh"
            description="Hali birorta ham material yaratmagansiz. Generatorga o'tib ishni boshlang!"
            action={
              <Button asChild variant="default" className="h-12 px-8 rounded-2xl font-bold">
                <Link to="/app/generator">Yaratishni boshlash</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
