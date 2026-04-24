import { useQuery } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, type AdminOverviewPayload } from '@teacher-assistant/shared'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'

export function AdminFeatureAnalyticsPage() {
  const { t } = useI18n()
  const query = useQuery({
    queryKey: ['admin-overview', 'features'],
    queryFn: () => apiRequest<AdminOverviewPayload>('/admin/overview'),
  })

  const usage = query.data?.featureUsage ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.features.eyebrow')}
        title={t('admin.features.title')}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {FEATURE_DEFINITIONS.map((feature) => {
          const stats = usage.find((item) => item.featureKey === feature.key)
          return (
            <Card key={feature.key}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{feature.label}</h2>
                  <Badge variant="outline">{feature.creditCost} kredit</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-secondary p-4">
                    <div className="text-sm text-muted-foreground">So'rovlar</div>
                    <div className="mt-2 text-2xl font-semibold">{stats?.totalRequests ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4">
                    <div className="text-sm text-muted-foreground">Sarflangan kredit</div>
                    <div className="mt-2 text-2xl font-semibold">{stats?.creditsConsumed ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4 sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Jami tokenlar</div>
                    <div className="mt-2 text-2xl font-semibold">{(stats?.totalTokens ?? 0).toLocaleString('en-US')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
