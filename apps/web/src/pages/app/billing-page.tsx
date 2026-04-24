import { useQuery } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, PLAN_DEFINITIONS, type TeacherDashboardPayload } from '@teacher-assistant/shared'
import { CheckCircle2, ShoppingBag, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardLoader } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { env } from '@/lib/env'
import { formatCurrencyUzs, formatDate } from '@/lib/format'
import { sortPlans, type PlanConfig } from '@/lib/plans'

export function BillingPage() {
  const { t } = useI18n()
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

  if (!dashboardQuery.data) {
    return <CardLoader />
  }

  return (
    <div className="space-y-4 animate-in pb-8">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('billing.currentPlan')}</div>
              <div className="mt-1 text-2xl font-black">{subscription?.planName ?? t('billing.noSubscription')}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-xs text-muted-foreground">{t('dashboard.creditsLeft')}</div>
              <div className="mt-1 text-lg font-black">{subscription?.creditsRemaining ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-xs text-muted-foreground">{t('billing.renewal')}</div>
              <div className="mt-1 text-sm font-black">{subscription?.renewsAt ? formatDate(subscription.renewsAt) : t('billing.notSet')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planKey === plan.key
          const upgradeLink = env.telegramBotUsername
            ? `https://t.me/${env.telegramBotUsername}?start=upgrade_${plan.key}`
            : null

          return (
            <Card key={plan.key}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-black">{plan.name}</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  </div>
                  {isCurrent ? <Badge variant="gradient">{t('billing.currentPlanButton')}</Badge> : null}
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-black">{formatCurrencyUzs(plan.priceMonthlyUzs)}</div>
                    <div className="text-sm text-muted-foreground">{t('billing.perMonth')}</div>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">{plan.monthlyCredits} {t('billing.monthlyTokens')}</div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('billing.fullAccess')}
                </div>

                {isCurrent ? (
                  <Button className="w-full" disabled>
                    {t('billing.currentPlanButton')}
                  </Button>
                ) : upgradeLink ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={upgradeLink} target="_blank" rel="noreferrer">
                      <ShoppingBag className="h-4 w-4" />
                      {t('billing.buyInTelegram')}
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/app/settings">{t('billing.openSettings')}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="text-lg font-black tracking-tight">{t('billing.creditCosts')}</div>
          <div className="space-y-2">
            {FEATURE_DEFINITIONS.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                <span className="font-semibold">{feature.label}</span>
                <span className="text-muted-foreground">{feature.creditCost} {t('billing.credits')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
