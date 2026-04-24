import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { formatRelativeDate, getFeatureLabel } from '@/lib/format'

interface ActivityResponse {
  activity: Array<{
    id: string
    userId: string
    teacherName: string | null
    featureKey: 'quiz' | 'lesson_plan' | 'writing_feedback' | 'speaking_questions' | 'pdf_export'
    creditsConsumed: number
    totalTokens: number
    modelName: string
    source: string
    createdAt: string
  }>
}

export function AdminActivityPage() {
  const { t } = useI18n()
  const query = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => apiRequest<ActivityResponse>('/admin/activity'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.activity.eyebrow')}
        title={t('admin.activity.title')}
      />

      <div className="grid gap-4">
        {query.data?.activity.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-medium">{row.teacherName ?? row.userId}</h2>
                  <Badge variant="outline">{getFeatureLabel(row.featureKey)}</Badge>
                  <Badge>{row.source}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {row.creditsConsumed} {t('admin.activity.creditUnit')} | {row.totalTokens.toLocaleString('en-US')} {t('admin.activity.tokenUnit')} |{' '}
                  {row.modelName}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{formatRelativeDate(row.createdAt)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
