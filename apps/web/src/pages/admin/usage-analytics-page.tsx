import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, Bot, Cpu, Zap } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/api'
import { getFeatureLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

interface UsageRow {
  id: string
  userId: string
  teacherName: string | null
  featureKey: 'quiz' | 'lesson_plan' | 'writing_feedback' | 'speaking_questions' | 'pdf_export'
  creditsConsumed: number
  modelName: string
  source: string
  createdAt: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

type UsageChartPoint = {
  date: string
  label: string
  longLabel: string
  totalRequests: number
  totalCredits: number
  totalTokens: number
}

type TooltipEntry<T> = {
  payload: T
}

function UsageChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<TooltipEntry<UsageChartPoint>>
}) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]?.payload

  return (
    <div className="w-[min(230px,calc(100vw-2.5rem))] rounded-2xl border border-white/10 bg-[#09111d]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{point.longLabel}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">So'rovlar</span>
          <span className="font-black text-white">{point.totalRequests}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Kreditlar</span>
          <span className="font-black text-sky-300">{point.totalCredits}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Tokenlar</span>
          <span className="font-black text-cyan-300">{point.totalTokens.toLocaleString('en-US')}</span>
        </div>
      </div>
    </div>
  )
}

export function AdminUsageAnalyticsPage() {
  const query = useQuery({
    queryKey: ['admin-usage'],
    queryFn: () => apiRequest<{ rows: UsageRow[] }>('/admin/usage'),
  })

  const rows = useMemo(() => query.data?.rows ?? [], [query.data?.rows])

  const chartData = useMemo<UsageChartPoint[]>(() => {
    const counts = new Map<string, { totalRequests: number; totalCredits: number; totalTokens: number }>()

    for (const row of rows) {
      const date = row.createdAt.slice(0, 10)
      const current = counts.get(date) ?? { totalRequests: 0, totalCredits: 0, totalTokens: 0 }
      current.totalRequests += 1
      current.totalCredits += row.creditsConsumed
      current.totalTokens += row.totalTokens
      counts.set(date, current)
    }

    const end = new Date()
    const start = subDays(end, 13)

    return eachDayOfInterval({ start, end }).map((day) => {
      const iso = format(day, 'yyyy-MM-dd')
      const stats = counts.get(iso)

      return {
        date: iso,
        label: format(day, 'MMM d'),
        longLabel: format(day, 'MMMM d'),
        totalRequests: stats?.totalRequests ?? 0,
        totalCredits: stats?.totalCredits ?? 0,
        totalTokens: stats?.totalTokens ?? 0,
      }
    })
  }, [rows])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.requests += 1
        acc.credits += row.creditsConsumed
        acc.tokens += row.totalTokens
        return acc
      },
      { requests: 0, credits: 0, tokens: 0 },
    )
  }, [rows])

  const topFeature = useMemo(() => {
    const featureCounts = new Map<string, number>()

    for (const row of rows) {
      featureCounts.set(row.featureKey, (featureCounts.get(row.featureKey) ?? 0) + 1)
    }

    return [...featureCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  }, [rows])

  const sourceStats = useMemo(() => {
    const sourceCounts = new Map<string, number>()

    for (const row of rows) {
      sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1)
    }

    return [...sourceCounts.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const peakDay = useMemo(() => {
    return chartData.reduce(
      (max, item) => (item.totalRequests > max.totalRequests ? item : max),
      chartData[0] ?? { label: '-', totalRequests: 0 },
    )
  }, [chartData])

  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        eyebrow="Detailed Logs"
        title="Usage Analytics"
      />

      <div className="grid grid-cols-3 gap-2 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <Card className="border-none bg-slate-100/80 shadow-none dark:bg-white/[0.04]">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-[10px] sm:tracking-[0.2em]">Jami so'rovlar</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{totals.requests}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300 max-sm:hidden">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-100/80 shadow-none dark:bg-white/[0.04]">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-[10px] sm:tracking-[0.2em]">Sarflangan kredit</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{totals.credits}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 max-sm:hidden">
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-100/80 shadow-none dark:bg-white/[0.04]">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-[10px] sm:tracking-[0.2em]">Jami tokenlar</p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{totals.tokens.toLocaleString('en-US')}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300 max-sm:hidden">
                <Cpu className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/85 max-md:col-span-3 dark:border-white/5 dark:bg-[#0f1724] xl:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Eng faol kanal</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{sourceStats[0]?.[0] ?? '-'}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{sourceStats[0]?.[1] ?? 0} ta so'rov</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                <Bot className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 bg-white/85 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">So'nggi 14 kun dinamikasi</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Pik kun</div>
                  <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{peakDay?.label ?? '-'}</div>
                  <div className="text-xs font-medium text-sky-300">{peakDay?.totalRequests ?? 0} ta so'rov</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Top funksiya</div>
                  <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                    {topFeature ? getFeatureLabel(topFeature[0] as UsageRow['featureKey']) : '-'}
                  </div>
                  <div className="text-xs font-medium text-cyan-300">{topFeature?.[1] ?? 0} ta so'rov</div>
                </div>
              </div>
            </div>

            <div className="h-[280px] sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.14)" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  />
                  <Tooltip content={<UsageChartTooltip />} />
                  <Bar yAxisId="left" dataKey="totalRequests" fill="#38bdf8" radius={[8, 8, 0, 0]} maxBarSize={28} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalTokens"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0, fill: '#22d3ee' }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#67e8f9' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/85 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5 sm:p-8">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Qisqa xulosa</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">O'rtacha yuklama</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {chartData.length > 0 ? (totals.requests / chartData.length).toFixed(1) : '0.0'}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">kuniga so'rov</div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Manba bo'yicha</div>
                <div className="mt-4 space-y-3">
                  {sourceStats.map(([source, count]) => (
                    <div key={source}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{source}</span>
                        <span className="font-black text-slate-900 dark:text-white">{count}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
                          style={{ width: `${totals.requests > 0 ? (count / totals.requests) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Kuzatuv</div>
                <div className="mt-3 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                  {topFeature
                    ? `${getFeatureLabel(topFeature[0] as UsageRow['featureKey'])} hozircha eng ko'p ishlatilmoqda. Bu funksiya operatsion yuklamaning asosiy qismini berayotgan bo'lishi mumkin.`
                    : "Hozircha yetarli ma'lumot yo'q."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/70 bg-white/90 shadow-xl dark:border-white/5 dark:bg-[#0f1724] dark:shadow-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/90 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:border-white/5 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-8 py-5">Teacher</th>
                  <th className="px-8 py-5">Feature</th>
                  <th className="px-8 py-5">Model</th>
                  <th className="px-8 py-5">Credits</th>
                  <th className="px-8 py-5">Tokens</th>
                  <th className="px-8 py-5">Source</th>
                  <th className="px-8 py-5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-slate-700 dark:divide-white/5 dark:text-slate-300">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 dark:text-white">{row.teacherName ?? row.userId}</div>
                      <div className="text-[11px] font-medium text-slate-500">{row.userId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="outline" className="border-border/70 text-slate-700 text-[10px] uppercase tracking-widest font-bold dark:border-white/10 dark:text-slate-300">
                        {getFeatureLabel(row.featureKey)}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-[11px] font-medium uppercase tracking-widest text-slate-500">{row.modelName}</td>
                    <td className="px-8 py-5 font-black text-sky-300">{row.creditsConsumed}</td>
                    <td className="px-8 py-5 font-medium">{row.totalTokens.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <Badge
                        className={cn(
                          'border-none text-[9px] uppercase tracking-widest',
                           row.source === 'telegram' ? 'bg-cyan-500/10 text-cyan-300' : 'bg-slate-200/70 text-slate-600 dark:bg-white/5 dark:text-slate-300',
                        )}
                      >
                        {row.source}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-[11px]">{format(parseISO(row.createdAt), 'MMM d, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
