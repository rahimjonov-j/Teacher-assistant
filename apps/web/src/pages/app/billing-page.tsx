import { useQuery } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, PLAN_DEFINITIONS, type TeacherDashboardPayload } from '@teacher-assistant/shared'
import { Link } from 'react-router-dom'
import { Zap, MessageCircleMore, CheckCircle2 } from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { env } from '@/lib/env'
import { formatCurrencyUzs, formatDate } from '@/lib/format'
import { sortPlans, type PlanConfig } from '@/lib/plans'
import { cn } from '@/lib/utils'

const subscriptionTone = {
  active: 'border-emerald-300/60 bg-emerald-50/90 ring-2 ring-emerald-200/70 dark:border-emerald-500/25 dark:bg-emerald-950/20 dark:ring-emerald-500/15',
  trialing: 'border-sky-300/60 bg-sky-50/90 ring-2 ring-sky-200/70 dark:border-sky-500/25 dark:bg-sky-950/20 dark:ring-sky-500/15',
  past_due: 'border-amber-300/70 bg-amber-50/90 ring-2 ring-amber-200/70 dark:border-amber-500/30 dark:bg-amber-950/20 dark:ring-amber-500/15',
  canceled: 'border-rose-300/70 bg-rose-50/90 ring-2 ring-rose-200/70 dark:border-rose-500/30 dark:bg-rose-950/20 dark:ring-rose-500/15',
  expired: 'border-slate-300/70 bg-slate-50/90 ring-2 ring-slate-200/70 dark:border-slate-600/40 dark:bg-slate-900/60 dark:ring-slate-700/30',
} as const

const statusLabel = {
  active: 'Aktiv',
  trialing: 'Sinov',
  past_due: "To'lov kutilmoqda",
  canceled: 'Bekor qilingan',
  expired: 'Tugagan',
} as const

export function BillingPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<TeacherDashboardPayload>('/teacher/dashboard'),
  })

  const plansQuery = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => apiRequest<{ plans: PlanConfig[] }>('/plans'),
  })

  const subscription = dashboardQuery.data?.subscription
  const plans = plansQuery.data?.plans?.length
    ? sortPlans(plansQuery.data.plans)
    : PLAN_DEFINITIONS.map((plan) => ({
        key: plan.key,
        name: plan.name,
        monthlyCredits: plan.monthlyCredits,
        priceMonthlyUzs: plan.priceMonthlyUzs,
        description: plan.description,
      }))
  const planNameByKey = new Map(plans.map((plan) => [plan.key, plan.name]))

  if (dashboardQuery.isLoading) {
    return <CardLoader />
  }

  return (
    <div className="space-y-8 px-4 animate-in pb-12 sm:px-0 sm:space-y-10">
      <PageHeader
        eyebrow="Moliyaviy holat"
        title="Obuna va Tariflar"
      />

      <Card className="overflow-hidden border-none bg-gradient-to-tr from-primary to-sky-500 text-white shadow-2xl shadow-primary/20">
        <CardContent className="p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Joriy tarif</p>
              <p className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">
                {subscription ? planNameByKey.get(subscription.planKey) ?? subscription.planKey : "Obuna yo'q"}
              </p>
              {subscription && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium opacity-80">
                  <span>{subscription.creditsRemaining} kredit qolgan</span>
                  {subscription.renewsAt ? <span>| Yangilanish: {formatDate(subscription.renewsAt)}</span> : null}
                </div>
              )}
            </div>
            <div className="h-16 w-16 rounded-3xl bg-white/20 p-4 backdrop-blur-sm sm:h-20 sm:w-20">
              <Zap className="h-full w-full fill-white" />
            </div>
          </div>
          {subscription && (
            <div className="mt-6 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all duration-1000"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (subscription.creditsRemaining / Math.max(subscription.creditsTotal, 1)) * 100,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span>{subscription.creditsUsed} sarflandi</span>
                <span>{subscription.creditsRemaining} qoldi</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-6 text-2xl font-black tracking-tight">Tariflar</h2>
        <div className="grid gap-3 sm:gap-5 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.planKey === plan.key
            const upgradeLink = env.telegramBotUsername
              ? `https://t.me/${env.telegramBotUsername}?start=upgrade_${plan.key}`
              : null

            return (
              <Card
                key={plan.key}
                className={cn(
                  'relative min-w-0 overflow-hidden border-border/40 bg-card/85 transition-colors',
                  isCurrent && subscription ? subscriptionTone[subscription.status] : 'hover:border-primary/30',
                )}
              >
                {isCurrent ? <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-sky-500" /> : null}
                <CardContent className="min-w-0 space-y-4 p-5 sm:space-y-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="min-w-0 break-words text-lg font-black tracking-tight">{plan.name}</h3>
                    {isCurrent ? (
                      <Badge className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                        {subscription ? statusLabel[subscription.status] : 'Joriy'}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <span className="break-words text-3xl font-black tracking-tight sm:text-4xl">{formatCurrencyUzs(plan.priceMonthlyUzs)}</span>
                    <span className="text-sm font-medium text-muted-foreground">/oy</span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-muted-foreground/70">{plan.description}</p>
                  <ul className="space-y-2 text-sm font-medium">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {plan.monthlyCredits} oylik token
                    </li>
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full rounded-2xl font-bold" disabled>
                      Joriy tarif
                    </Button>
                  ) : upgradeLink ? (
                    <Button asChild className="w-full rounded-2xl font-bold" variant="outline">
                      <a href={upgradeLink} target="_blank" rel="noreferrer">
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                        Sotib olish
                      </a>
                    </Button>
                  ) : (
                    <Button asChild className="w-full rounded-2xl font-bold" variant="outline">
                      <Link to="/app/settings">Sotib olish</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Card className="border-none bg-card/85 shadow-xl backdrop-blur-xl">
        <CardContent className="space-y-5 p-5 sm:p-8">
          <h2 className="text-xl font-black tracking-tight">Funksiyalar kredit narxi</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURE_DEFINITIONS.map((feature) => (
              <div key={feature.key} className="rounded-2xl border border-border/50 bg-secondary/40 p-4">
                <div className="font-bold">{feature.label}</div>
                <div className="mt-2 flex items-center gap-1 text-sm font-black text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  {feature.creditCost} kredit
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
