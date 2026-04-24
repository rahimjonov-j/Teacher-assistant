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
import { useI18n } from '@/hooks/use-i18n'

type TrendPoint = {
  period: string
  totalRequests: number
  creditsConsumed: number
  totalTokens: number
  label: string
  longLabel: string
}

type PiePoint = {
  featureKey: string
  totalRequests: number
  totalTokens: number
  fill: string
  label: string
  share: number
}

type TooltipEntry<T> = {
  payload: T
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
    <div className="w-[min(220px,calc(100vw-2.5rem))] rounded-xl border border-white/10 bg-[#09111d]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{point.longLabel}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Requests</span>
          <span className="font-black text-white">{point.totalRequests}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Credits</span>
          <span className="font-black text-sky-300">{point.creditsConsumed}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Tokens</span>
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
    <div className="w-[min(220px,calc(100vw-2.5rem))] rounded-xl border border-white/10 bg-[#09111d]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{point.label}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Share</span>
          <span className="font-black text-white">{point.share}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Requests</span>
          <span className="font-black text-sky-300">{point.totalRequests}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Tokens</span>
          <span className="font-black text-cyan-300">{point.totalTokens.toLocaleString('en-US')}</span>
        </div>
      </div>
    </div>
  )
}

export function AdminDashboardTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.14)" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
  )
}

export function AdminDashboardFeatureChart({ data, topLabel, topShare }: { data: PiePoint[]; topLabel: string; topShare: number }) {
  const { t } = useI18n()

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="totalRequests" nameKey="label" innerRadius={72} outerRadius={102} paddingAngle={6}>
            {data.map((item) => (
              <Cell key={item.featureKey} fill={item.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<AdminFeatureTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('admin.dashboard.topShare')}</div>
        <div className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{topShare}%</div>
        <div className="mt-1 max-w-[140px] text-xs font-medium text-slate-500 dark:text-slate-400">
          {topLabel || t('admin.dashboard.noDataYet')}
        </div>
      </div>
    </div>
  )
}
