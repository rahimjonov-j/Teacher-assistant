import { useQuery } from '@tanstack/react-query'
import type { FeatureKey, TeacherDashboardPayload } from '@teacher-assistant/shared'
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  CreditCard,
  Mic,
  MessageSquareText,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardLoader } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { formatRelativeDate, getFeatureLabel, getPlanName } from '@/lib/format'
import { cn } from '@/lib/utils'

const featureConfig: Record<FeatureKey, { icon: typeof Sparkles; color: string; bg: string }> = {
  quiz: { icon: ClipboardList, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  lesson_plan: { icon: BookOpen, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  writing_feedback: { icon: MessageSquareText, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  speaking_questions: { icon: Mic, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  pdf_export: { icon: Sparkles, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
}

function OnboardingStep({ step, title, description, to, done }: { step: number; title: string; description: string; to: string; done?: boolean }) {
  return (
    <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors',
        done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
      )}>
        {done ? '✓' : step}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </Link>
  )
}

export function DashboardPage() {
  const { t } = useI18n()
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<TeacherDashboardPayload>('/teacher/dashboard'),
  })

  const data = query.data

  if (!data) return <CardLoader />

  const firstName = data.profile.fullName?.split(' ')[0] ?? t('dashboard.teacherFallback')
  const credits = data.subscription?.creditsRemaining ?? 0
  const planName = data.subscription?.planKey ? getPlanName(data.subscription.planKey) : null
  const recentItems = data.recentContent.slice(0, 5)
  const isNewUser = data.recentContent.length === 0
  const hasProfile = Boolean(data.profile.fullName && data.profile.schoolName)

  return (
    <div className="space-y-5 animate-in pb-8">

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-violet-700 p-5 shadow-[0_8px_32px_-8px_rgba(99,102,241,0.5)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_65%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/50">{t('dashboard.welcome')}</div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white">{firstName}</h1>
              {data.profile.schoolName ? (
                <div className="mt-1 text-sm text-white/60">{data.profile.schoolName}</div>
              ) : null}
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Credits + Plan row */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Zap className="h-4 w-4 shrink-0 text-yellow-300" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t('dashboard.creditsLeft')}</div>
                <div className="text-lg font-black text-white">{credits}</div>
              </div>
            </div>
            {planName ? (
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <CreditCard className="h-4 w-4 shrink-0 text-white/50" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t('dashboard.currentPlan')}</div>
                  <div className="text-sm font-black text-white">{planName}</div>
                </div>
              </div>
            ) : (
              <Link
                to="/app/billing"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/15"
              >
                Tarif tanlash →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Onboarding for new users ── */}
      {isNewUser ? (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-4">
            <div className="text-base font-black tracking-tight">Boshlash uchun 3 qadam</div>
            <p className="mt-1 text-sm text-muted-foreground">Teacher Assistant-dan to'g'ri foydalanishni boshlang</p>
          </div>
          <div className="space-y-3">
            <OnboardingStep
              step={1}
              title="Profilingizni to'ldiring"
              description="Ism, maktab va sinf yo'nalishini kiriting"
              to="/app/settings"
              done={hasProfile}
            />
            <OnboardingStep
              step={2}
              title="Birinchi materialingizni yarating"
              description="AI yordamida test, dars rejasi yoki writing tahlili yarating"
              to="/app/generator"
            />
            <OnboardingStep
              step={3}
              title="Tarifni tanlang"
              description="Oylik kreditlar bilan ishlashni boshlang"
              to="/app/billing"
            />
          </div>
        </div>
      ) : null}

      {/* ── Quick actions ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-base font-black tracking-tight">{t('dashboard.shortcuts')}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.shortcutsHint')}</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl text-xs">
            <Link to="/app/generator">{t('common.open')}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.quickActions.map((feature) => {
            const config = featureConfig[feature.key]
            const Icon = config.icon
            return (
              <Link
                key={feature.key}
                to={`/app/generator?feature=${feature.key}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-colors', config.bg)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div>
                  <div className="text-sm font-bold leading-snug">{getFeatureLabel(feature.key)}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{feature.creditCost} kredit</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-base font-black tracking-tight">{t('dashboard.recentActivities')}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.recentActivitiesHint')}</p>
          </div>
          {recentItems.length > 0 ? (
            <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl text-xs">
              <Link to="/app/messenger">{t('dashboard.viewAll')}</Link>
            </Button>
          ) : null}
        </div>

        {recentItems.length > 0 ? (
          <div className="space-y-2">
            {recentItems.map((item) => {
              const config = featureConfig[item.featureKey]
              const Icon = config.icon
              return (
                <Link
                  key={item.id}
                  to={`/app/history/${item.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-all hover:border-primary/20 hover:bg-primary/5"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{item.title}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[10px]">
                        {getFeatureLabel(item.featureKey)}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold">{t('dashboard.noActivity')}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.noActivityHint')}</p>
            </div>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/app/generator">
                <Sparkles className="h-4 w-4" />
                {t('dashboard.createFirst')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
