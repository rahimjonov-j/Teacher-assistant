import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, DollarSign, PencilLine, Sparkles, Users, X } from 'lucide-react'
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
  priceMonthlyUsd: string
  description: string
}

const statusTone: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  trialing: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  past_due: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  canceled: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  expired: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
}

const planAccent: Record<PlanKey, string> = {
  free_trial: 'from-slate-400/90 to-slate-500/90',
  basic: 'from-sky-400 to-sky-500',
  pro: 'from-primary to-sky-500',
  premium: 'from-amber-400 to-orange-500',
}

export function AdminSubscriptionsPage() {
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
  const activeCount = subscriptions.filter((subscription) =>
    ['trialing', 'active', 'past_due'].includes(subscription.status),
  ).length
  const summary = {
    planCount: plans.length,
    activeCount,
    userCount: subscriptions.length,
    averagePrice:
      plans.length > 0
        ? (plans.reduce((sum, plan) => sum + plan.priceMonthlyUsd, 0) / plans.length).toFixed(1)
        : '0.0',
  }

  const openEditModal = (plan: PlanConfig) => {
    setEditingPlan({
      key: plan.key,
      name: plan.name,
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

    const numericPrice = Number(editingPlan.priceMonthlyUsd)
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      toast.error("Narx noto'g'ri kiritilgan.")
      return
    }

    savePlanMutation.mutate(editingPlan)
  }

  if (plansQuery.isLoading && subscriptionsQuery.isLoading) {
    return <CardLoader />
  }

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        eyebrow="Obunalarni kuzatish"
        title="Obunalar"
        description="Tarif sozlamalari va foydalanuvchi obunalarini shu joydan boshqaring."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-white/90 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Tariflar
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight">{summary.planCount}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/90 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Faol obunalar
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight">{summary.activeCount}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/90 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Foydalanuvchilar
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight">{summary.userCount}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/90 dark:border-white/5 dark:bg-[#0f1724]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  O'rtacha narx
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight">${summary.averagePrice}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Tarif sozlamalari</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Frontenddagi pricing va billing bo'limlari shu qiymatlarni ko'rsatadi.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className="overflow-hidden border-border/70 bg-white/95 shadow-xl dark:border-white/5 dark:bg-[#0f1724]"
            >
              <CardContent className="p-0">
                <div className={cn('h-1.5 bg-gradient-to-r', planAccent[plan.key])} />
                <div className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-border/70 bg-background/70 uppercase">
                          {plan.key}
                        </Badge>
                        {plan.key === 'pro' ? <Badge variant="gradient">Tavsiya</Badge> : null}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <DollarSign className="h-4 w-4 text-primary" />
                          ${plan.priceMonthlyUsd} / oy
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="shrink-0 rounded-2xl"
                      onClick={() => openEditModal(plan)}
                    >
                      <PencilLine className="h-4 w-4" />
                      Tahrirlash
                    </Button>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Oylik kredit
                      </div>
                      <div className="mt-2 text-2xl font-black tracking-tight">{plan.monthlyCredits}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Ko'rinish
                      </div>
                      <div className="mt-2 text-base font-semibold text-foreground">
                        {plan.key === 'free_trial' ? 'Sinov tarif' : 'Pullik tarif'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Foydalanuvchi obunalari</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Har bir foydalanuvchining joriy tarifi, kreditlari va yangilanish sanasi.
          </p>
        </div>

        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card
              key={subscription.id}
              className="border-border/70 bg-white/95 shadow-xl dark:border-white/5 dark:bg-[#0f1724]"
            >
              <CardContent className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-border/70 bg-background/70">
                      {planNameByKey.get(subscription.plan_key) ?? subscription.plan_key}
                    </Badge>
                    <Badge className={cn('border-none', statusTone[subscription.status] ?? statusTone.expired)}>
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

                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Yangilanish: {formatDate(subscription.renews_at)} | Boshlangan sana:{' '}
                    {formatDate(subscription.created_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                  <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Qolgan kredit
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">
                      {subscription.credits_remaining}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Sarflangan
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">
                      {subscription.credits_used}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {editingPlan ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <Card className="w-full max-w-2xl overflow-hidden border-border/70 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1724]">
            <CardContent className="p-0">
              <div className={cn('h-1.5 bg-gradient-to-r', planAccent[editingPlan.key])} />

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
                      Faqat title, narx va textni yangilaysiz. Kredit miqdori o'zgarmaydi.
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
                <div className="grid gap-5 sm:grid-cols-[1.2fr_0.8fr]">
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
                    <Label htmlFor="plan-price">Narx (USD)</Label>
                    <Input
                      id="plan-price"
                      className="h-12 rounded-2xl"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editingPlan.priceMonthlyUsd}
                      onChange={(event) =>
                        setEditingPlan((prev) => (prev ? { ...prev, priceMonthlyUsd: event.target.value } : prev))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-description">Text</Label>
                  <Textarea
                    id="plan-description"
                    className="min-h-[170px] rounded-[28px]"
                    value={editingPlan.description}
                    onChange={(event) =>
                      setEditingPlan((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                    }
                  />
                </div>

                <div className="rounded-3xl border border-border/60 bg-secondary/25 p-4 text-sm text-muted-foreground">
                  O'zgartirishlar saqlangandan keyin `pricing`, `billing` va Telegram botdagi `/plans`
                  ro'yxati ham yangi ma'lumotni ko'rsatadi.
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                <Button variant="outline" onClick={closeModal} disabled={savePlanMutation.isPending}>
                  Bekor qilish
                </Button>
                <Button onClick={handleSavePlan} disabled={savePlanMutation.isPending}>
                  {savePlanMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
