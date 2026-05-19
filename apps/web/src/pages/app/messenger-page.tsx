import { useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FeatureKey, GeneratedContentRecord } from '@teacher-assistant/shared'
import { BookOpen, ClipboardList, Mic, MessageSquareText, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardLoader } from '@/components/shared/loading-state'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { formatRelativeDate, getFeatureLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const featureFilters: Array<{ key: FeatureKey | 'all'; label: string }> = [
  { key: 'all', label: 'Hammasi' },
  { key: 'quiz', label: 'Test' },
  { key: 'lesson_plan', label: 'Dars rejasi' },
  { key: 'writing_feedback', label: 'Writing' },
  { key: 'speaking_questions', label: 'Speaking' },
]

const featureConfig: Record<FeatureKey, { icon: typeof Sparkles; color: string; bg: string }> = {
  quiz: { icon: ClipboardList, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  lesson_plan: { icon: BookOpen, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  writing_feedback: { icon: MessageSquareText, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  speaking_questions: { icon: Mic, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  pdf_export: { icon: Sparkles, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
}

function toPreview(markdown: string) {
  return markdown.replace(/[#*_`>-]/g, '').replace(/\s+/g, ' ').trim()
}

export function MessengerPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FeatureKey | 'all'>('all')
  const deferredSearch = useDeferredValue(search.trim())

  const query = useQuery({
    queryKey: ['messenger-history', deferredSearch],
    queryFn: () =>
      apiRequest<{ items: GeneratedContentRecord[] }>(
        `/teacher/history?search=${encodeURIComponent(deferredSearch)}&feature=`,
      ),
    placeholderData: (prev) => prev,
  })

  const items = useMemo(() => {
    const all = (query.data?.items ?? []).map((item) => ({
      ...item,
      preview: toPreview(item.outputMarkdown).slice(0, 100),
    }))
    if (activeFilter === 'all') return all
    return all.filter((item) => item.featureKey === activeFilter)
  }, [query.data?.items, activeFilter])

  if (!query.data) return <CardLoader />

  return (
    <div className="space-y-4 animate-in pb-8">

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('messenger.searchPlaceholder')}
          className="h-11 w-full rounded-2xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* ── Feature filter pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {featureFilters.map((filter) => {
          const isActive = activeFilter === filter.key
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* ── List ── */}
      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((item) => {
            const config = featureConfig[item.featureKey] ?? featureConfig.pdf_export
            const Icon = config.icon
            return (
              <Link
                key={item.id}
                to={`/app/history/${item.id}`}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
              >
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', config.bg)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate text-sm font-bold">{item.title}</div>
                    <div className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeDate(item.createdAt)}</div>
                  </div>
                  {item.preview ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.preview}</p>
                  ) : null}
                  <div className="mt-2">
                    <span className={cn(
                      'inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold',
                      config.bg, config.color,
                    )}>
                      {getFeatureLabel(item.featureKey)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold">{t('messenger.empty')}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t('messenger.emptyHint')}</p>
          </div>
          <Link
            to="/app/generator"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Material yaratish
          </Link>
        </div>
      )}
    </div>
  )
}
