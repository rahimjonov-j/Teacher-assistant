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
    <div className="w-[min(230px,calc(100vw-2.5rem))] rounded-xl border border-white/10 bg-[#09111d]/95 p-4 shadow-2xl backdrop-blur-xl">
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

export function AdminUsageChart({ data }: { data: UsageChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.14)" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
  )
}
