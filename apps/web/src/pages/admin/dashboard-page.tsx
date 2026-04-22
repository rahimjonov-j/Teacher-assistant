import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { eachDayOfInterval, format, subDays } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import type { AdminOverviewPayload } from '@teacher-assistant/shared'
import { Activity, Clock3, Sparkles, TrendingUp, UserCircle2, Zap } from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { formatRelativeDate, getFeatureLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

type TrendPoint = AdminOverviewPayload['usageTrend'][number] & {
  label: string
  longLabel: string
}

type PiePoint = AdminOverviewPayload['featureUsage'][number] & {
  fill: string
  label: string
  share: number
}

type TooltipEntry<T> = {
  payload: T
  value?: number | string
}

function AdminTrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<TooltipEntry<TrendPoint>>
}) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]?.payload

  return (
    <div className="w-[min(220px,calc(100vw-2.5rem))] rounded-2xl border border-white/10 bg-[#09111d]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{point.longLabel}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">So'rovlar</span>
          <span className="font-black text-white">{point.totalRequests}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Kredit</span>
          <span className="font-black text-sky-300">{point.creditsConsumed}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Tokenlar</span>
          <span className="font-black text-cyan-300">{point.totalTokens.toLocaleString('en-US')}</span>
        </div>
      </div>
    </div>
  )
}

function AdminFeatureTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<TooltipEntry<PiePoint>>
}) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]?.payload

  return (
    <div className="w-[min(220px,calc(100vw-2.5rem))] rounded-2xl border border-white/10 bg-[#09111d]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{point.label}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Ulashuv</span>
          <span className="font-black text-white">{point.share}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">So'rovlar</span>
          <span className="font-black text-sky-300">{point.totalRequests}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Tokenlar</span>
          <span className="font-black text-cyan-300">{point.totalTokens.toLocaleString('en-US')}</span>
        </div>
      </div>
    </div>
  )
}

const featurePalette = ['#38bdf8', '#0ea5e9', '#0284c7', '#22d3ee'] as const

export function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiRequest<AdminOverviewPayload>('/admin/overview'),
  })

  const data = query.data

  const trendData = useMemo<TrendPoint[]>(() => {
    const trendMap = new Map(data?.usageTrend.map((item) => [item.period, item]) ?? [])
    const end = new Date()
    const start = subDays(end, 13)

    return eachDayOfInterval({ start, end }).map((day) => {
      const iso = format(day, 'yyyy-MM-dd')
      const point = trendMap.get(iso)

      return {
        period: iso,
        totalRequests: point?.totalRequests ?? 0,
        creditsConsumed: point?.creditsConsumed ?? 0,
        totalTokens: point?.totalTokens ?? 0,
        label: format(day, 'MMM d'),
        longLabel: format(day, 'MMMM d'),
      }
    })
  }, [data?.usageTrend])

  const trendSummary = useMemo(() => {
    const totalRequests = trendData.reduce((sum, item) => sum + item.totalRequests, 0)
    const totalTokens = trendData.reduce((sum, item) => sum + item.totalTokens, 0)
    const activeDays = trendData.filter((item) => item.totalRequests > 0).length
    const peakDay = trendData.reduce((max, item) => (item.totalRequests > max.totalRequests ? item : max), trendData[0])

    return {
      totalRequests,
      totalTokens,
      activeDays,
      averagePerDay: totalRequests > 0 ? (totalRequests / trendData.length).toFixed(1) : '0.0',
      peakDayLabel: peakDay?.label ?? '-',
      peakDayRequests: peakDay?.totalRequests ?? 0,
    }
  }, [trendData])

  const featureData = useMemo<PiePoint[]>(() => {
    const total = data?.featureUsage.reduce((sum, item) => sum + item.totalRequests, 0) ?? 0

    return (data?.featureUsage ?? []).map((item, index) => ({
      ...item,
      fill: featurePalette[index % featurePalette.length],
      label: getFeatureLabel(item.featureKey),
      share: total > 0 ? Math.round((item.totalRequests / total) * 100) : 0,
    }))
  }, [data?.featureUsage])

  const topFeature = featureData[0] ?? null
  const topTeacher = data?.topTeachers[0] ?? null

  if (!data) {
    return <CardLoader />
  }

  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        eyebrow="Admin analytics"
        title="Platforma holati"
        description="So'nggi faollik, eng ko'p ishlatilayotgan vositalar va tizim yuklamasini bitta joyda ko'ring."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi, i) => (
          <Card key={kpi.label} className="overflow-hidden border-border/70 bg-white/85 text-foreground dark:border-white/5 dark:bg-[#0f1724] dark:text-slate-100">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{kpi.value}</p>
                </div>
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl border',
                    i % 2 === 0 ? 'border-sky-500/20 bg-sky-500/10 text-sky-400' : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
                  )}
                >
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400">{kpi.delta || 'Realtime'}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">joriy holat</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-white/85 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Faollik dinamikasi</h2>
                  <Badge variant="outline" className="border-border/70 text-slate-500 dark:border-white/10 dark:text-slate-400">
                    14 kun
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:min-w-[360px]">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Faol kunlar
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{trendSummary.activeDays}</div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Pik kun
                  </div>
                  <div className="mt-2 text-lg font-black leading-tight text-slate-900 dark:text-white">{trendSummary.peakDayLabel}</div>
                  <div className="text-[11px] font-medium text-sky-300">{trendSummary.peakDayRequests} ta so'rov</div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <Zap className="h-3.5 w-3.5" />
                    O'rtacha
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{trendSummary.averagePerDay}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">kuniga so'rov</div>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<AdminTrendTooltip />} cursor={{ stroke: 'rgba(56,189,248,0.2)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="totalRequests"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    fill="url(#usageGradient)"
                    dot={{ r: 3, strokeWidth: 0, fill: '#38bdf8' }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#67e8f9' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">14 kunlik jami</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{trendSummary.totalRequests}</div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">so'rov yuborilgan</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Token yuklamasi</div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{trendSummary.totalTokens.toLocaleString('en-US')}</div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">jami token qayta ishlangan</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/85 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Eng ko'p ishlatilgan vositalar</h2>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Qaysi funksiya platformada asosiy yukni olayotganini ko'rsatadi.
                </p>
              </div>
              {topFeature ? (
                <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-300">
                  Top: {topFeature.label}
                </Badge>
              ) : null}
            </div>

            <div className="relative mt-6 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={featureData}
                    dataKey="totalRequests"
                    nameKey="label"
                    innerRadius={72}
                    outerRadius={102}
                    paddingAngle={6}
                  >
                    {featureData.map((item) => (
                      <Cell key={item.featureKey} fill={item.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<AdminFeatureTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Top ulashuv</div>
                <div className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{topFeature?.share ?? 0}%</div>
                <div className="mt-1 max-w-[140px] text-xs font-medium text-slate-500 dark:text-slate-400">
                  {topFeature?.label ?? 'Hozircha ma\'lumot yo\'q'}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {featureData.map((item) => (
                <div key={item.featureKey} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.share}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${item.share}%`, backgroundColor: item.fill }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{item.totalRequests} ta so'rov</span>
                    <span>{item.totalTokens.toLocaleString('en-US')} token</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-white/85 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Eng faol o'qituvchilar</h2>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Hozirgi davrda eng ko'p material yaratgan foydalanuvchilar.
                </p>
              </div>
              {topTeacher ? (
                <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-300">
                  Yetakchi: {topTeacher.totalRequests}
                </Badge>
              ) : null}
            </div>

            <div className="mt-8 space-y-4">
              {data.topTeachers.map((teacher, index) => (
                <div key={teacher.userId} className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                      <UserCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{teacher.fullName || teacher.email.split('@')[0]}</div>
                        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{teacher.email}</div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-black text-sky-300">{teacher.totalRequests} so'rov</div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{teacher.totalTokens.toLocaleString('en-US')} token</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/85 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">So'nggi faollik</h2>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Yaqinda platformada yaratilgan materiallar oqimi.
                </p>
              </div>
              <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                LIVE
              </Badge>
            </div>

            <div className="mt-8 space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{activity.teacherName || "Noma'lum foydalanuvchi"}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        <span className="rounded-full bg-sky-500/10 px-2 py-1 text-sky-300">
                          {getFeatureLabel(activity.featureKey)}
                        </span>
                        <span>{activity.creditsConsumed} kredit</span>
                        <span>{activity.totalTokens.toLocaleString('en-US')} token</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                      {formatRelativeDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-8 h-12 w-full rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:text-white"
              asChild
            >
              <Link to="/admin/activity">Batafsil tarixni ko'rish</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
