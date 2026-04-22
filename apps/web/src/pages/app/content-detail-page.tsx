import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import type { GeneratedContentRecord } from '@teacher-assistant/shared'
import { toast } from 'sonner'
import { ArrowLeft, Copy, FileDown, Loader2 } from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { formatDate, getFeatureLabel } from '@/lib/format'
import ReactMarkdown from 'react-markdown'

export function ContentDetailPage() {
  const params = useParams()

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
      toast.success('PDF eksport yakunlandi.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "PDF eksport qilib bo'lmadi.")
    },
  })

  const item = query.data?.item

  if (!item) {
    return <CardLoader />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in pb-12">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" className="rounded-xl font-bold text-muted-foreground hover:text-foreground">
          <Link to="/app/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tarixga qaytish
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 font-bold border-border/40"
            onClick={() => {
              navigator.clipboard.writeText(item.outputMarkdown)
              toast.success('Nusxalandi!')
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Nusxa olish
          </Button>
          {item.pdfUrl ? (
            <Button asChild variant="outline" size="sm" className="rounded-xl h-9 font-bold border-border/40">
              <a href={item.pdfUrl} target="_blank" rel="noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 font-bold border-border/40"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              PDF Eksport
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden border-none bg-card/60 shadow-xl backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {getFeatureLabel(item.featureKey)}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground/60">{formatDate(item.createdAt)}</span>
            <span className="text-xs font-medium text-muted-foreground/60">{item.creditsConsumed} kredit</span>
          </div>
          <h1 className="mb-8 text-3xl font-black tracking-tight">{item.title}</h1>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{item.outputMarkdown}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
