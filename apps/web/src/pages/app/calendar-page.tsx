import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GeneratedContentRecord } from '@teacher-assistant/shared'
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardLoader } from '@/components/shared/loading-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { getFeatureLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function CalendarPage() {
  const { language, t } = useI18n()
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const query = useQuery({
    queryKey: ['calendar-history'],
    queryFn: () => apiRequest<{ items: GeneratedContentRecord[] }>('/teacher/history?search=&feature='),
  })

  const items = query.data?.items ?? []

  const itemsByDate = useMemo(() => {
    const map = new Map<string, GeneratedContentRecord[]>()
    items.forEach((item) => {
      const key = item.createdAt.slice(0, 10)
      const existing = map.get(key) ?? []
      existing.push(item)
      map.set(key, existing)
    })
    return map
  }, [items])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth)
    const firstDayIndex = (monthStart.getDay() + 6) % 7
    const startDate = new Date(monthStart)
    startDate.setDate(monthStart.getDate() - firstDayIndex)

    return Array.from({ length: 35 }, (_, index) => {
      const current = new Date(startDate)
      current.setDate(startDate.getDate() + index)
      const key = toDateKey(current)
      return {
        key,
        label: current.getDate(),
        isCurrentMonth: current.getMonth() === visibleMonth.getMonth(),
        count: itemsByDate.get(key)?.length ?? 0,
      }
    })
  }, [itemsByDate, visibleMonth])

  const selectedItems = itemsByDate.get(selectedDate) ?? []

  if (!query.data) {
    return <CardLoader />
  }

  return (
    <div className="space-y-4 animate-in">
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-black">
              {visibleMonth.toLocaleDateString(language === 'en' ? 'en-US' : 'uz-UZ', { month: 'long', year: 'numeric' })}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDate(day.key)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm transition-colors',
                  day.key === selectedDate ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground',
                  !day.isCurrentMonth && 'opacity-35',
                )}
              >
                <span className="font-semibold">{day.label}</span>
                {day.count > 0 ? (
                  <span className={cn('mt-1 h-1.5 w-1.5 rounded-full', day.key === selectedDate ? 'bg-background' : 'bg-foreground')} />
                ) : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
            <div className="text-lg font-black tracking-tight">{t('calendar.eventsOn')} {selectedDate}</div>
          <div className="mt-4 space-y-3">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Link key={item.id} to={`/app/history/${item.id}`} className="block rounded-2xl border border-border p-4 transition-colors hover:bg-secondary">
                  <div className="text-sm font-black">{item.title}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{getFeatureLabel(item.featureKey)}</span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(item.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                {t('calendar.noEvents')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
