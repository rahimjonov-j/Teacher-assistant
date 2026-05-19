import { useQuery } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, PLAN_DEFINITIONS, type TeacherDashboardPayload } from '@teacher-assistant/shared'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Mic,
  MessageSquareText,
  Sparkles,
  Zap,
} from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { planDescriptions } from '@/lib/i18n'
import { formatCurrencyUzs, formatDate, getFeatureLabel, getPlanName } from '@/lib/format'
import { sortPlans, type PlanConfig } from '@/lib/plans'
import { cn } from '@/lib/utils'

const featureIcons: Record<string, typeof Sparkles> = {
  quiz: ClipboardList,
  lesson_plan: BookOpen,
  writing_feedback: MessageSquareText,
  speaking_questions: Mic,
  pdf_export: Sparkles,
}

const featureColors: Record<string, { color: string; bg: string }> = {
  quiz: { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  lesson_plan: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  writing_feedback: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  speaking_questions: { color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  pdf_export: { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
}

const planAccentColors: Record<string, { from: string; ring: string; badge: string }> = {
  free: { from: 'from-slate-600 to-slate-700', ring: 'ring-slate-400/30', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  starter: { from: 'from-indigo-500 to-violet-600', ring: 'ring-indigo-400/30', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  pro: { from: 'from-violet-600 to-purple-700', ring: 'ring-violet-400/30', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  premium: { from: 'from-amber-500 to-orange-600', ring: 'ring-amber-400/30', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
}

export function BillingPage() {
  const { language, t } = useI18n()
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

      {/* ── Current subscription hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-violet-700 p-5 shadow-[0_8px_32px_-8px_rgba(99,102,241,0.5)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_65%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/50">{t('billing.currentPlan')}</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                {subscription?.planKey ? getPlanName(subscription.planKey) : t('billing.noSubscription')}
              </h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Zap className="h-4 w-4 shrink-0 text-yellow-300" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t('dashboard.creditsLeft')}</div>
                <div className="text-lg font-black text-white">{subscription?.creditsRemaining ?? 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t('billing.renewal')}</div>
                <div className="text-sm font-black text-white">
                  {subscription?.renewsAt ? formatDate(subscription.renewsAt) : t('billing.notSet')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Plans ── */}
      <div className="space-y-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planKey === plan.key
          const accent = planAccentColors[plan.key] ?? planAccentColors.starter

          return (
            <div
              key={plan.key}
              className={cn(
                'overflow-hidden rounded-3xl border bg-card transition-all',
                isCurrent ? 'border-primary/30 shadow-md ring-2 ring-primary/15' : 'border-border',
              )}
            >
              {/* Plan header */}
              <div className={cn('flex items-center justify-between gap-3 bg-gradient-to-r px-5 py-4', accent.from)}>
                <div>
                  <div className="text-lg font-black text-white">{getPlanName(plan.key)}</div>
                  <div className="mt-0.5 text-xs text-white/70">{plan.monthlyCredits} kredit / oy</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{formatCurrencyUzs(plan.priceMonthlyUzs)}</div>
                  <div className="text-[11px] text-white/60">{t('billing.perMonth')}</div>
                </div>
              </div>

              {/* Plan body */}
              <div className="space-y-4 p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {planDescriptions[language][plan.key] ?? plan.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">{t('billing.fullAccess')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">{plan.monthlyCredits} {t('billing.monthlyTokens')}</span>
                  </div>
                </div>

                {isCurrent ? (
                  <div className={cn('flex items-center justify-center rounded-xl py-2.5 text-sm font-bold', accent.badge)}>
                    {t('billing.currentPlanButton')}
                  </div>
                ) : (
                  <a
                    href="mailto:admin@teacher-assistant.uz"
                    className="flex items-center justify-center rounded-xl border border-border bg-muted py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted/70"
                  >
                    {t('billing.openSettings')}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Feature credit costs ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4">
          <div className="text-base font-black tracking-tight">{t('billing.creditCosts')}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Har bir funksiya uchun sarflanadigan kredit</p>
        </div>
        <div className="space-y-2">
          {FEATURE_DEFINITIONS.map((feature) => {
            const FIcon = featureIcons[feature.key] ?? Sparkles
            const fc = featureColors[feature.key] ?? featureColors.pdf_export
            return (
              <div key={feature.key} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', fc.bg)}>
                  <FIcon className={cn('h-4 w-4', fc.color)} />
                </div>
                <span className="flex-1 text-sm font-semibold">{getFeatureLabel(feature.key)}</span>
                <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-bold">{feature.creditCost} {t('billing.credits')}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
