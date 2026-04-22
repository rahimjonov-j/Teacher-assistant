import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  PencilLine,
  Sparkles,
  Users,
  X,
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
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/format'
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
  priceMonthlyUsd: string
  description: string
}

const statusTone: Record<string, string> = {
  active: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  trialing: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  past_due: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  canceled: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  expired: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
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

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

function getUserInitials(fullName: string | null, email: string | null) {
  const base = fullName?.trim() || email?.trim() || 'T A'
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminSubscriptionsPage() {
  const queryClient = useQueryClient()
  const [editingPlan, setEditingPlan] = useState<PlanFormState | null>(null)

  useEffect(() => {
    if (!editingPlan) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [editingPlan])

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
          priceMonthlyUsd: Number(input.priceMonthlyUsd),
          description: input.description.trim(),
        }),
      }),
    onSuccess: async () => {
      toast.success("Tarif ma'lumotlari yangilandi.")
      setEditingPlan(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-plan-configs'] }),
        queryClient.invalidateQueries({ queryKey: ['public-plans'] }),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Tarifni yangilab bo'lmadi.")
    },
  })

  const plans = plansQuery.data?.plans ? sortPlans(plansQuery.data.plans) : []
  const subscriptions = subscriptionsQuery.data?.subscriptions ?? []
  const planNameByKey = new Map(plans.map((plan) => [plan.key, plan.name]))
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
        ? plans.reduce((sum, plan) => sum + plan.priceMonthlyUsd, 0) / plans.length
        : 0,
  }

  const openEditModal = (plan: PlanConfig) => {
    setEditingPlan({
      key: plan.key,
      name: plan.name,
      monthlyCredits: String(plan.monthlyCredits),
      priceMonthlyUsd: String(plan.priceMonthlyUsd),
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
      toast.error("Kredit soni noto'g'ri kiritilgan.")
      return
    }

    const numericPrice = Number(editingPlan.priceMonthlyUsd)
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
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

  const editingMeta = editingPlan ? planMeta[editingPlan.key] : null
  const previewCreditsValue = Number(editingPlan?.monthlyCredits ?? 0)
  const previewCredits = Number.isFinite(previewCreditsValue) ? previewCreditsValue : 0
  const previewPriceValue = Number(editingPlan?.priceMonthlyUsd ?? 0)
  const previewPrice = Number.isFinite(previewPriceValue) ? previewPriceValue : 0

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        eyebrow="Obunalarni kuzatish"
        title="Obunalar"
        description="Tariflar, aktiv foydalanuvchilar va kredit oqimini bitta tushunarli sahifada boshqaring."
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
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    Bu yerda qilingan o‘zgarishlar public pricing sahifasida, teacher billing oynasida va
                    Telegram botdagi plan javoblarida bir xil ko‘rinadi.
                  </p>
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
                    <div className="mt-2 text-3xl font-black tracking-tight">{formatUsd(summary.averagePrice)}</div>
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
                    <div className="text-sm font-bold tracking-tight">Kredit oqimi</div>
                    <div className="text-xs text-muted-foreground">Joriy ishlatilish va qolgan zaxira</div>
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
                      Sarflangan kredit
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">{usedCreditsTotal}</div>
                  </div>
                  <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/35">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Qolgan kredit
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">{remainingCreditsTotal}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-border/60 bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
                  Umumiy foydalanuvchi soni <span className="font-semibold text-foreground">{summary.userCount}</span>{' '}
                  ta. Kredit balansi paneldan darhol ko‘rinadi.
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
            <p className="mt-1 text-sm text-muted-foreground">
              Har bir plan uchun narx, positioning va foydalanuvchiga ko‘rinadigan matn shu yerdan yangilanadi.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground dark:bg-slate-950/30">
            Planlar tartibi: Trial, Basic, Pro, Premium
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {plans.map((plan) => {
            const meta = planMeta[plan.key]
            const creditFill = Math.max(14, Math.round((plan.monthlyCredits / maxCredits) * 100))

            return (
              <Card
                key={plan.key}
                className="h-full overflow-hidden border-white/70 bg-white/95 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-[#0f1724]/95"
              >
                <CardContent className="h-full p-0">
                  <div className={cn('relative h-full overflow-hidden p-5 sm:p-6', meta.surfaceClass)}>
                    <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_72%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_72%)]" />

                    <div className="relative flex h-full flex-col gap-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={meta.badgeClass}>{meta.label}</Badge>
                            {plan.key === 'pro' ? <Badge variant="gradient">Top</Badge> : null}
                          </div>

                          <div className="space-y-1.5">
                            <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                            <p className="text-xs font-medium text-muted-foreground">{meta.audience}</p>
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
                        <div className="mt-1 text-3xl font-black tracking-tight">{formatUsd(plan.priceMonthlyUsd)}</div>
                      </div>

                      <p className="min-h-[72px] text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[20px] border border-border/60 bg-background/70 p-3.5 dark:bg-slate-950/35">
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Kredit
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
                          <span>Kredit limiti</span>
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
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Foydalanuvchi obunalari</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ism, tarif, foydalanish ko‘rsatkichi va yangilanish sanasi shu blokda ixcham ko‘rinadi.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground dark:bg-slate-950/30">
            Jami {summary.userCount} ta obuna yozuvi
          </div>
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid gap-4">
            {subscriptions.map((subscription) => {
              const usageTotal = subscription.credits_remaining + subscription.credits_used
              const userUsagePercent =
                usageTotal > 0 ? Math.round((subscription.credits_used / usageTotal) * 100) : 0

              return (
                <Card
                  key={subscription.id}
                  className="overflow-hidden border-white/70 bg-white/95 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-[#0f1724]/95"
                >
                  <CardContent className="p-0">
                    <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_290px]">
                      <div className="p-5 sm:p-6">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-primary/10 text-base font-black text-primary">
                            {getUserInitials(subscription.user_full_name, subscription.user_email)}
                          </div>

                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-border/70 bg-background/70">
                                {planNameByKey.get(subscription.plan_key) ?? subscription.plan_key}
                              </Badge>
                              <Badge
                                className={cn(
                                  'border-none shadow-none',
                                  statusTone[subscription.status] ?? statusTone.expired,
                                )}
                              >
                                {subscription.status}
                              </Badge>
                            </div>

                            <div>
                              <div className="truncate text-lg font-bold tracking-tight text-foreground">
                                {subscription.user_full_name || "Noma'lum foydalanuvchi"}
                              </div>
                              {subscription.user_email ? (
                                <div className="mt-1 break-all text-sm text-muted-foreground">
                                  {subscription.user_email}
                                </div>
                              ) : null}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-[22px] border border-border/60 bg-secondary/25 p-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  Boshlangan sana
                                </div>
                                <div className="mt-2 text-sm font-semibold text-foreground">
                                  {formatDate(subscription.created_at)}
                                </div>
                              </div>

                              <div className="rounded-[22px] border border-border/60 bg-secondary/25 p-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Yangilanish
                                </div>
                                <div className="mt-2 text-sm font-semibold text-foreground">
                                  {formatDate(subscription.renews_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/60 bg-secondary/18 p-5 xl:border-l xl:border-t-0 xl:p-6">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <div className="rounded-[22px] border border-border/60 bg-background/80 p-4 dark:bg-slate-950/35">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Qolgan kredit
                            </div>
                            <div className="mt-2 text-2xl font-black tracking-tight">
                              {subscription.credits_remaining}
                            </div>
                          </div>

                          <div className="rounded-[22px] border border-border/60 bg-background/80 p-4 dark:bg-slate-950/35">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Sarflangan
                            </div>
                            <div className="mt-2 text-2xl font-black tracking-tight">
                              {subscription.credits_used}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-[22px] border border-border/60 bg-background/80 p-4 dark:bg-slate-950/35">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            <span>Foydalanish</span>
                            <span>{userUsagePercent}%</span>
                          </div>
                          <div className="mt-3 h-2.5 rounded-full bg-secondary/80">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500"
                              style={{ width: `${Math.max(userUsagePercent, usageTotal > 0 ? 10 : 0)}%` }}
                            />
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            Tarif: {planNameByKey.get(subscription.plan_key) ?? subscription.plan_key}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-[#0f1724]/90">
            <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Obuna yozuvlari topilmadi</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Foydalanuvchilar tariflarni olgandan keyin ular shu yerda ism va status bilan ko‘rinadi.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {editingPlan && editingMeta ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <Card className="w-full max-w-5xl overflow-hidden border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1724]">
            <CardContent className="p-0">
              <div className={cn('h-1.5 bg-gradient-to-r', planAccent[editingPlan.key])} />

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5 sm:px-8">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-border/70 bg-background/70 uppercase">
                          {editingPlan.key}
                        </Badge>
                        <Badge variant="accent">Tarif sozlamasi</Badge>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">Tarifni tahrirlash</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Title, kredit, narx va tavsifni yangilang. O'ng tomonda natijani darhol ko'rasiz.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 rounded-2xl"
                      onClick={closeModal}
                      disabled={savePlanMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-5 px-6 py-6 sm:px-8">
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.45fr_0.45fr]">
                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Title</Label>
                        <Input
                          id="plan-name"
                          className="h-12 rounded-2xl"
                          value={editingPlan.name}
                          onChange={(event) =>
                            setEditingPlan((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="plan-credits">Kredit</Label>
                        <Input
                          id="plan-credits"
                          className="h-12 rounded-2xl"
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
                        <Label htmlFor="plan-price">Narx (USD)</Label>
                        <Input
                          id="plan-price"
                          className="h-12 rounded-2xl"
                          type="number"
                          min={0}
                          step="0.01"
                          value={editingPlan.priceMonthlyUsd}
                          onChange={(event) =>
                            setEditingPlan((prev) =>
                              prev ? { ...prev, priceMonthlyUsd: event.target.value } : prev,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan-description">Text</Label>
                      <Textarea
                        id="plan-description"
                        className="min-h-[180px] rounded-[28px]"
                        value={editingPlan.description}
                        onChange={(event) =>
                          setEditingPlan((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                        }
                      />
                    </div>

                    <div className="rounded-[24px] border border-border/60 bg-secondary/25 p-4 text-sm text-muted-foreground">
                      Saqlangandan keyin pricing, billing, dashboard va Telegram botdagi `/plans` javobi yangi
                      title, kredit va narx bilan yangilanadi. Aktiv foydalanuvchilarning kredit limiti ham shu
                      qiymatga moslashtiriladi.
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                    <Button variant="outline" onClick={closeModal} disabled={savePlanMutation.isPending}>
                      Bekor qilish
                    </Button>
                    <Button variant="gradient" onClick={handleSavePlan} disabled={savePlanMutation.isPending}>
                      {savePlanMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border/60 bg-secondary/20 p-6 sm:p-8 lg:border-l lg:border-t-0">
                  <div className="flex h-full flex-col rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/45">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="gradient">Live preview</Badge>
                      <Badge className={editingMeta.badgeClass}>{editingMeta.label}</Badge>
                    </div>

                    <div className="mt-5 rounded-[26px] border border-border/60 bg-background/85 p-5 dark:bg-slate-950/35">
                      <div className={cn('h-1.5 rounded-full bg-gradient-to-r', planAccent[editingPlan.key])} />

                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Public ko‘rinish
                          </div>
                          <div className="text-2xl font-black tracking-tight">
                            {editingPlan.name.trim() || 'Plan nomi'}
                          </div>
                          <div className="text-sm leading-relaxed text-muted-foreground">
                            {editingPlan.description.trim() || 'Tarif uchun tavsif shu yerda ko‘rinadi.'}
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-secondary/30 p-4">
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Oylik narx
                          </div>
                          <div className="mt-2 text-3xl font-black tracking-tight">{formatUsd(previewPrice)}</div>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-secondary/30 p-4">
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Oylik kredit
                          </div>
                          <div className="mt-2 text-3xl font-black tracking-tight">{previewCredits}</div>
                        </div>

                        <div className="space-y-2">
                          {editingMeta.bullets.map((bullet) => (
                            <div key={bullet} className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                          <div className="rounded-[22px] border border-border/60 bg-secondary/25 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Auditoriya
                            </div>
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              {editingMeta.audience}
                            </div>
                          </div>

                          <div className="rounded-[22px] border border-border/60 bg-secondary/25 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Plan helper
                            </div>
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              {editingMeta.helper}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs leading-relaxed text-muted-foreground">
                      Preview kartasi foydalanuvchiga chiqadigan umumiy hissani ko'rsatadi. Saqlangandan keyin shu
                      plan bilan ishlayotgan aktiv subscriptionlar ham yangi kredit limitiga moslanadi.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
