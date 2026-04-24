import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  const pdfWindowRef = useRef<Window | null>(null)

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
    onSuccess: async (data) => {
      queryClient.setQueryData<{ item: GeneratedContentRecord }>(['content-detail', params.id], (current) =>
        current
          ? {
              item: {
                ...current.item,
                pdfUrl: data.pdfUrl,
              },
            }
          : current,
      )
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['messenger-history'] })
      await queryClient.invalidateQueries({ queryKey: ['database-history'] })
      await queryClient.invalidateQueries({ queryKey: ['calendar-history'] })

      if (pdfWindowRef.current && !pdfWindowRef.current.closed) {
        pdfWindowRef.current.location.href = data.pdfUrl
        pdfWindowRef.current = null
      } else {
        window.open(data.pdfUrl, '_blank', 'noopener,noreferrer')
      }

      toast.success(t('detail.exportDone'))
    },
    onError: (error) => {
      if (pdfWindowRef.current && !pdfWindowRef.current.closed) {
        pdfWindowRef.current.close()
        pdfWindowRef.current = null
      }

      if (error instanceof ApiRequestError && error.statusCode === 402) {
        toast.error(t('detail.creditEnded'))
        navigate('/app/billing')
        return
      }

      toast.error(error instanceof Error ? error.message : t('detail.exportFailed'))
    },
  })

  const handleExportPdf = () => {
    pdfWindowRef.current = window.open('about:blank', '_blank')
    if (pdfWindowRef.current) {
      pdfWindowRef.current.opener = null
      writePdfExportLoader(pdfWindowRef.current.document, t('detail.exportPdf'), t('common.loading'))
    }
    exportMutation.mutate()
  }

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
              <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exportMutation.isPending}>
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

function writePdfExportLoader(documentRef: Document, title: string, loadingLabel: string) {
  documentRef.open()
  documentRef.write(`<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; }
      body {
        min-height: 100%;
        display: grid;
        place-items: center;
        background: #fafafa;
        color: #111111;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .shell {
        width: min(92vw, 380px);
        border: 1px solid #e5e5e5;
        border-radius: 18px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 22px 70px -46px rgba(0,0,0,0.35);
        text-align: center;
      }
      .icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 18px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: #111111;
        color: #ffffff;
      }
      .spinner {
        width: 26px;
        height: 26px;
        border: 3px solid rgba(255,255,255,0.28);
        border-top-color: #ffffff;
        border-radius: 999px;
        animation: spin 0.8s linear infinite;
      }
      h1 {
        margin: 0;
        font-size: 20px;
        line-height: 1.25;
        font-weight: 800;
        letter-spacing: 0;
      }
      p {
        margin: 10px 0 0;
        color: #666666;
        font-size: 14px;
        line-height: 1.6;
      }
      .bar {
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: #eeeeee;
        margin-top: 22px;
      }
      .bar span {
        display: block;
        width: 38%;
        height: 100%;
        border-radius: inherit;
        background: #111111;
        animation: slide 1.2s ease-in-out infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes slide {
        0% { transform: translateX(-110%); }
        50% { transform: translateX(90%); }
        100% { transform: translateX(270%); }
      }
      @media (prefers-color-scheme: dark) {
        body { background: #111111; color: #f5f5f5; }
        .shell { background: #171717; border-color: #2b2b2b; }
        .icon, .bar span { background: #f5f5f5; color: #111111; }
        .spinner { border-color: rgba(17,17,17,0.25); border-top-color: #111111; }
        p { color: #a3a3a3; }
        .bar { background: #2b2b2b; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="icon"><div class="spinner" aria-hidden="true"></div></div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(loadingLabel)}. PDF fayl tayyorlanmoqda...</p>
      <div class="bar"><span></span></div>
    </main>
  </body>
</html>`)
  documentRef.close()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
