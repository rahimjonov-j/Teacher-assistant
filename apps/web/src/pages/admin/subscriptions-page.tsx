import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { formatDate, getPlanName } from '@/lib/format'

interface SubscriptionsResponse {
  subscriptions: Array<{
    id: string
    user_id: string
    user_full_name: string | null
    user_email: string | null
    plan_key: 'free_trial' | 'basic' | 'pro' | 'premium'
    status: string
    credits_remaining: number
    credits_used: number
    renews_at: string | null
    created_at: string
  }>
}

export function AdminSubscriptionsPage() {
  const query = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => apiRequest<SubscriptionsResponse>('/admin/subscriptions'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Obunalarni kuzatish"
        title="Obunalar"
        description="Tarif va kredit holati."
      />

      <div className="grid gap-4">
        {query.data?.subscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{getPlanName(subscription.plan_key)}</h2>
                  <Badge variant="outline">{subscription.status}</Badge>
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  {subscription.user_full_name || "Noma'lum foydalanuvchi"}
                </div>
                {subscription.user_email ? (
                  <div className="text-xs text-muted-foreground">{subscription.user_email}</div>
                ) : null}
                <div className="mt-2 text-sm text-muted-foreground">
                  Yangilanish: {formatDate(subscription.renews_at)} • Boshlangan sana: {formatDate(subscription.created_at)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[280px]">
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
    </div>
  )
}
