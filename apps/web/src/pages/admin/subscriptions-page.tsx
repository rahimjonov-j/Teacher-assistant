import { PLAN_DEFINITIONS } from '@teacher-assistant/shared'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  PencilLine,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { CardLoader } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { sortPlans, type PlanConfig, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'

interface SubscriptionsResponse {
  subscriptions: Array<{
    id: string
    user_id: string
    user_full_name: string | null
    user_email: string | null
    plan_key: PlanKey
    status: string
    credits_remaining: number
    credits_used: number
    renews_at: string | null
    created_at: string
  }>
}

interface PlansResponse {
  plans: PlanConfig[]
}

type PlanFormState = {
  key: PlanKey
  name: string
  monthlyCredits: string
  priceMonthlyUzs: string
  description: string
}

const planAccent: Record<PlanKey, string> = {
  free_trial: 'from-slate-400/90 to-slate-500/90',
  basic: 'from-sky-400 to-sky-500',
  pro: 'from-primary to-sky-500',
  premium: 'from-amber-400 to-orange-500',
}

const planMeta: Record<
  PlanKey,
  {
    label: string
    audience: string
    helper: string
    bullets: string[]
    surfaceClass: string
    badgeClass: string
  }
> = {
  free_trial: {
    label: 'Start',
    audience: 'Yangi foydalanuvchilar',
    helper: 'Platformani tez sinab ko‘rish uchun yengil paket.',
    bullets: ['Tez onboarding', 'Asosiy workflow', 'Risksiz start'],
    surfaceClass:
      'bg-gradient-to-br from-slate-50 via-white to-slate-100/90 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-900',
    badgeClass:
      'border border-slate-300/70 bg-white/85 text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200',
  },
  basic: {
    label: 'Daily',
    audience: 'Kundalik ishlaydigan o‘qituvchilar',
    helper: 'Reja, test va oddiy dars oqimi uchun balansli tarif.',
    bullets: ['Barqaror limit', 'Tez javoblar', 'Sodda boshqaruv'],
    surfaceClass:
      'bg-gradient-to-br from-sky-50 via-white to-cyan-50/80 dark:from-slate-950 dark:via-[#102033] dark:to-[#0e1b2d]',
    badgeClass:
      'border border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/12 dark:text-sky-300',
  },
  pro: {
    label: 'Top choice',
    audience: 'Faol ishlaydigan o‘qituvchilar',
    helper: 'Narx va quvvat o‘rtasidagi eng qulay muvozanat.',
    bullets: ['Ko‘p so‘rov', 'Eng ko‘p tanlanadi', 'Yuqori samaradorlik'],
    surfaceClass:
      'bg-gradient-to-br from-blue-50 via-white to-indigo-50/80 dark:from-slate-950 dark:via-[#101c34] dark:to-[#111936]',
    badgeClass:
      'border border-primary/20 bg-primary/10 text-primary dark:border-primary/20 dark:bg-primary/12 dark:text-sky-300',
  },
  premium: {
    label: 'Scale',
    audience: 'Yuqori oqim va katta yuklama',
    helper: 'Ko‘p so‘rov yuboradigan foydalanuvchilar uchun kuchli plan.',
    bullets: ['Eng katta limit', 'Og‘ir workflow', 'Keng imkoniyat'],
    surfaceClass:
      'bg-gradient-to-br from-amber-50 via-white to-orange-50/80 dark:from-slate-950 dark:via-[#24170f] dark:to-[#2b190f]',
    badgeClass:
      'border border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/12 dark:text-amber-300',
  },
}

function formatUzs(value: number) {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AdminSubscriptionsPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [editingPlan, setEditingPlan] = useState<PlanFormState | null>(null)

  const subscriptionsQuery = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => apiRequest<SubscriptionsResponse>('/admin/subscriptions'),
  })

  const plansQuery = useQuery({
    queryKey: ['admin-plan-configs'],
    queryFn: () => apiRequest<PlansResponse>('/admin/plans'),
  })

  const savePlanMutation = useMutation({
    mutationFn: (input: PlanFormState) =>
      apiRequest<{ plan: PlanConfig }>(`/admin/plans/${input.key}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: input.name.trim(),
          monthlyCredits: Number(input.monthlyCredits),
          priceMonthlyUzs: Number(input.priceMonthlyUzs),
          description: input.description.trim(),
        }),
      }),
    onSuccess: async () => {
      toast.success("Tarif ma'lumotlari yangilandi.")
      setEditingPlan(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-plan-configs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-usage'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-teachers'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['public-plans'] }),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Tarifni yangilab bo'lmadi.")
    },
  })

  const plans = plansQuery.data?.plans?.length
    ? sortPlans(plansQuery.data.plans)
    : PLAN_DEFINITIONS.map((plan) => ({
        key: plan.key,
        name: plan.name,
        monthlyCredits: plan.monthlyCredits,
        priceMonthlyUzs: plan.priceMonthlyUzs,
        description: plan.description,
      }))
  const subscriptions = subscriptionsQuery.data?.subscriptions ?? []
  const maxCredits = Math.max(...plans.map((plan) => plan.monthlyCredits), 1)
  const activeCount = subscriptions.filter((subscription) =>
    ['trialing', 'active', 'past_due'].includes(subscription.status),
  ).length
  const usedCreditsTotal = subscriptions.reduce((sum, subscription) => sum + subscription.credits_used, 0)
  const remainingCreditsTotal = subscriptions.reduce(
    (sum, subscription) => sum + subscription.credits_remaining,
    0,
  )
  const totalCreditsTracked = usedCreditsTotal + remainingCreditsTotal
  const usagePercent =
    totalCreditsTracked > 0 ? Math.round((usedCreditsTotal / totalCreditsTracked) * 100) : 0

  const summary = {
    planCount: plans.length,
    activeCount,
    userCount: subscriptions.length,
    averagePrice:
      plans.length > 0
        ? plans.reduce((sum, plan) => sum + plan.priceMonthlyUzs, 0) / plans.length
        : 0,
  }

  const openEditModal = (plan: PlanConfig) => {
    setEditingPlan({
      key: plan.key,
      name: plan.name,
      monthlyCredits: String(plan.monthlyCredits),
      priceMonthlyUzs: String(plan.priceMonthlyUzs),
      description: plan.description,
    })
  }

  const closeModal = () => {
    if (savePlanMutation.isPending) {
      return
    }

    setEditingPlan(null)
  }

  const handleSavePlan = () => {
    if (!editingPlan) {
      return
    }

    if (!editingPlan.name.trim() || !editingPlan.description.trim()) {
      toast.error("Sarlavha va tavsif bo'sh bo'lmasligi kerak.")
      return
    }

    const numericCredits = Number(editingPlan.monthlyCredits)
    if (!Number.isInteger(numericCredits) || numericCredits < 0) {
      toast.error("Token soni noto'g'ri kiritilgan.")
      return
    }

    const numericPrice = Number(editingPlan.priceMonthlyUzs)
    if (!Number.isInteger(numericPrice) || numericPrice < 0) {
      toast.error("Narx noto'g'ri kiritilgan.")
      return
    }

    savePlanMutation.mutate(editingPlan)
  }

  if (
    (plansQuery.isLoading && !plansQuery.data) ||
    (subscriptionsQuery.isLoading && !subscriptionsQuery.data)
  ) {
    return <CardLoader />
  }

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        eyebrow={t('admin.subscriptions.eyebrow')}
        title={t('admin.subscriptions.title')}
      />

      <Card className="overflow-hidden border-white/70 bg-white/85 dark:border-white/10 dark:bg-[#0d1422]/90">
        <CardContent className="p-0">
          <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_36%)]" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/15" />

            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-border/70 bg-white/80 dark:bg-slate-950/40">
                    Bitta boshqaruv markazi
                  </Badge>
                  <Badge variant="gradient">Pricing + Billing + Telegram sync</Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    Tariflar ko‘rinishi endi aniqroq va boshqarish uchun qulayroq.
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/35">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Tariflar
                    </div>
                    <div className="mt-2 text-3xl font-black tracking-tight">{summary.planCount}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Boshqarilayotgan planlar soni</div>
                  </div>

                  <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/35">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Faol obuna
                    </div>
                    <div className="mt-2 text-3xl font-black tracking-tight">{summary.activeCount}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Trial va aktiv statuslar bilan</div>
                  </div>

                  <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/35">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      O‘rtacha narx
                    </div>
                    <div className="mt-2 text-3xl font-black tracking-tight">{formatUzs(summary.averagePrice)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Tariflar kesimidagi o‘rtacha qiymat</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-tight">Token oqimi</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Ishlatilish darajasi</span>
                    <span>{usagePercent}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500"
                      style={{ width: `${Math.max(usagePercent, totalCreditsTracked > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/35">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Sarflangan token
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">{usedCreditsTotal}</div>
                  </div>
                  <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/35">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Qolgan token
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">{remainingCreditsTotal}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-border/60 bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
                  Umumiy foydalanuvchi soni <span className="font-semibold text-foreground">{summary.userCount}</span>{' '}
                  ta. Token balansi paneldan darhol ko‘rinadi.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Tarif sozlamalari</h2>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground dark:bg-slate-950/30">
            Planlar tartibi: Trial, Basic, Pro, Premium
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {plans.map((plan) => {
            const meta = planMeta[plan.key]
            const creditFill = Math.max(14, Math.round((plan.monthlyCredits / maxCredits) * 100))
            const isEditing = editingPlan?.key === plan.key

            return (
              <Card
                key={plan.key}
                className="h-full overflow-hidden border-white/70 bg-white/95 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-[#0f1724]/95"
              >
                <CardContent className="h-full p-0">
                  <div className={cn('relative h-full overflow-hidden p-5 sm:p-6', meta.surfaceClass)}>
                    <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_72%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_72%)]" />

                    {isEditing ? (
                      <div className="relative flex h-full flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <h3 className="text-xl font-black tracking-tight">Tarifni tahrirlash</h3>
                            <p className="text-xs font-medium uppercase text-muted-foreground">{plan.key}</p>
                          </div>
                          <Badge className={meta.badgeClass}>{meta.label}</Badge>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`plan-name-${plan.key}`}>Nomi</Label>
                            <Input
                              id={`plan-name-${plan.key}`}
                              value={editingPlan.name}
                              onChange={(event) =>
                                setEditingPlan((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                              }
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`plan-credits-${plan.key}`}>Oylik token</Label>
                              <Input
                                id={`plan-credits-${plan.key}`}
                                type="number"
                                min={0}
                                step="1"
                                value={editingPlan.monthlyCredits}
                                onChange={(event) =>
                                  setEditingPlan((prev) =>
                                    prev ? { ...prev, monthlyCredits: event.target.value } : prev,
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`plan-price-${plan.key}`}>Narx (UZS)</Label>
                              <Input
                                id={`plan-price-${plan.key}`}
                                type="number"
                                min={0}
                                step="1"
                                value={editingPlan.priceMonthlyUzs}
                                onChange={(event) =>
                                  setEditingPlan((prev) =>
                                    prev ? { ...prev, priceMonthlyUzs: event.target.value } : prev,
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`plan-description-${plan.key}`}>Tavsif</Label>
                            <Textarea
                              id={`plan-description-${plan.key}`}
                              className="min-h-[180px]"
                              value={editingPlan.description}
                              onChange={(event) =>
                                setEditingPlan((prev) =>
                                  prev ? { ...prev, description: event.target.value } : prev,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-auto flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                          <Button variant="outline" onClick={closeModal} disabled={savePlanMutation.isPending}>
                            Bekor qilish
                          </Button>
                          <Button variant="default" onClick={handleSavePlan} disabled={savePlanMutation.isPending}>
                            {savePlanMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex h-full flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={meta.badgeClass}>{meta.label}</Badge>
                              {plan.key === 'pro' ? <Badge variant="gradient">Top</Badge> : null}
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className="border-white/70 bg-white/80 uppercase dark:border-white/10 dark:bg-slate-950/40"
                          >
                            {plan.key}
                          </Badge>
                        </div>

                        <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/40">
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Oylik narx
                          </div>
                          <div className="mt-1 text-3xl font-black tracking-tight">{formatUzs(plan.priceMonthlyUzs)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-[20px] border border-border/60 bg-background/70 p-3.5 dark:bg-slate-950/35">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Token
                            </div>
                            <div className="mt-1.5 text-xl font-black tracking-tight">{plan.monthlyCredits}</div>
                          </div>

                          <div className="rounded-[20px] border border-border/60 bg-background/70 p-3.5 dark:bg-slate-950/35">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Turi
                            </div>
                            <div className="mt-1.5 text-sm font-semibold text-foreground">
                              {plan.key === 'free_trial' ? 'Sinov' : 'Pullik'}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/35">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            <span>Token limiti</span>
                            <span>{plan.monthlyCredits}</span>
                          </div>

                          <div className="mt-3 h-2.5 rounded-full bg-secondary/80">
                            <div
                              className={cn('h-full rounded-full bg-gradient-to-r', planAccent[plan.key])}
                              style={{ width: `${creditFill}%` }}
                            />
                          </div>

                          <div className="mt-4 grid gap-2">
                            {meta.bullets.map((bullet) => (
                              <div key={bullet} className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="mt-auto w-full rounded-2xl border-white/70 bg-white/85 dark:border-white/10 dark:bg-slate-950/40"
                          onClick={() => openEditModal(plan)}
                        >
                          <PencilLine className="h-4 w-4" />
                          Tahrirlash
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}


