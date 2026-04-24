import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GeneratedContentRecord } from '@teacher-assistant/shared'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardLoader } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiRequest } from '@/lib/api'
import { formatRelativeDate, getFeatureLabel } from '@/lib/format'

function toPreview(markdown: string) {
  return markdown.replace(/[#*_`>-]/g, '').replace(/\s+/g, ' ').trim()
}

export function MessengerPage() {
  const [search, setSearch] = useState('')
  const deferredSearch = useMemo(() => search.trim(), [search])
  const query = useQuery({
    queryKey: ['messenger-history', deferredSearch],
    queryFn: () =>
      apiRequest<{ items: GeneratedContentRecord[] }>(
        `/teacher/history?search=${encodeURIComponent(deferredSearch)}&feature=`,
      ),
  })

  const items = query.data?.items ?? []

  if (!query.data) {
    return <CardLoader />
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search conversations"
          className="pl-11"
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const preview = toPreview(item.outputMarkdown).slice(0, 92)

          return (
            <Link key={item.id} to={`/app/history/${item.id}`}>
              <Card className="transition-colors hover:bg-secondary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-black">{item.title}</div>
                        <div className="shrink-0 text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{preview || 'No preview available'}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Badge variant="outline">{getFeatureLabel(item.featureKey)}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-sm font-black">No conversations yet</div>
              <p className="mt-2 text-sm text-muted-foreground">Generated materials will appear here in a chat-style list.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
