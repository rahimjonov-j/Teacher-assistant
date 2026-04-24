import { useMutation, useQuery } from '@tanstack/react-query'
import type { GeneratedContentRecord } from '@teacher-assistant/shared'
import { ArrowLeft, Copy, FileDown } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CardLoader } from '@/components/shared/loading-state'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError, apiRequest } from '@/lib/api'
import { formatDate, getFeatureLabel } from '@/lib/format'

export function ContentDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { t } = useI18n()

  const query = useQuery({
    queryKey: ['content-detail', params.id],
    queryFn: () => apiRequest<{ item: GeneratedContentRecord }>(`/teacher/history/${params.id}`),
    enabled: Boolean(params.id),
  })

  const exportMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ pdfUrl: string }>(`/teacher/history/${params.id}/export-pdf`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      window.open(data.pdfUrl, '_blank', 'noopener,noreferrer')
      toast.success(t('detail.exportDone'))
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.statusCode === 402) {
        toast.error(t('detail.creditEnded'))
        navigate('/app/billing')
        return
      }

      toast.error(error instanceof Error ? error.message : t('detail.exportFailed'))
    },
  })

  const item = query.data?.item

  if (!item) {
    return <CardLoader />
  }

  return (
    <div className="space-y-4 animate-in pb-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/app/messenger">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{getFeatureLabel(item.featureKey)}</Badge>
            <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
            <span className="text-xs text-muted-foreground">{item.creditsConsumed} credits</span>
          </div>

          <div className="text-2xl font-black tracking-tight">{item.title}</div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(item.outputMarkdown)
                toast.success(t('detail.copied'))
              }}
            >
              <Copy className="h-4 w-4" />
              {t('detail.copy')}
            </Button>
            {item.pdfUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={item.pdfUrl} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                  {t('detail.pdf')}
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                {exportMutation.isPending ? <Spinner /> : <FileDown className="h-4 w-4" />}
                {t('detail.exportPdf')}
              </Button>
            )}
          </div>

          <div className="markdown-body">
            <MarkdownRenderer>{item.outputMarkdown}</MarkdownRenderer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
