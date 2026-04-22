import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
  const planNameByKey = new Map(plans.map((plan) => [plan.key, plan.name]))

  const openEditModal = (plan: PlanConfig) => {
    setEditingPlan({
      key: plan.key,
      name: plan.name,
      priceMonthlyUsd: String(plan.priceMonthlyUsd),
      description: plan.description,
    })
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Obunalarni kuzatish"
        title="Obunalar"
        description="Tarif va kredit holati."
      />

      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight">Tarif sozlamalari</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.key}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">${plan.priceMonthlyUsd}/oy</div>
                  </div>
                  <Badge variant="outline">{plan.key}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="text-xs font-semibold text-muted-foreground">
                  Oylik kredit: {plan.monthlyCredits}
                </div>
                <Button className="w-full" variant="outline" onClick={() => openEditModal(plan)}>
                  Tahrirlash
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight">Foydalanuvchi obunalari</h2>
        <div className="grid gap-4">
          {subscriptionsQuery.data?.subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">
                      {planNameByKey.get(subscription.plan_key) ?? subscription.plan_key}
                    </h2>
                    <Badge variant="outline">{subscription.status}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {subscription.user_full_name || "Noma'lum foydalanuvchi"}
                  </div>
                  {subscription.user_email ? (
                    <div className="text-xs text-muted-foreground">{subscription.user_email}</div>
                  ) : null}
                  <div className="mt-2 text-sm text-muted-foreground">
                    Yangilanish: {formatDate(subscription.renews_at)} | Boshlangan sana:{' '}
                    {formatDate(subscription.created_at)}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm sm:min-w-[280px] sm:grid-cols-2">
                  <div className="rounded-2xl bg-secondary p-4">
                    <div className="text-muted-foreground">Qolgan kredit</div>
                    <div className="mt-2 text-xl font-semibold">{subscription.credits_remaining}</div>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4">
                    <div className="text-muted-foreground">Sarflangan kredit</div>
                    <div className="mt-2 text-xl font-semibold">{subscription.credits_used}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {editingPlan ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl border-border/70 bg-white dark:border-white/10 dark:bg-[#0f1724]">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Tarifni tahrirlash</h3>
                <p className="text-sm text-muted-foreground">Title, narx va tavsifni yangilang.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-name">Title</Label>
                <Input
                  id="plan-name"
                  value={editingPlan.name}
                  onChange={(event) => setEditingPlan((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-price">Narx (USD)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingPlan.priceMonthlyUsd}
                  onChange={(event) =>
                    setEditingPlan((prev) => (prev ? { ...prev, priceMonthlyUsd: event.target.value } : prev))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-description">Text</Label>
                <Textarea
                  id="plan-description"
                  value={editingPlan.description}
                  onChange={(event) =>
                    setEditingPlan((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                  }
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setEditingPlan(null)} disabled={savePlanMutation.isPending}>
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
