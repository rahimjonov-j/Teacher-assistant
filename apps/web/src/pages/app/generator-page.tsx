import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  FEATURE_DEFINITIONS,
  type FeatureKey,
  type GeneratorResponse,
} from '@teacher-assistant/shared'
import { BookOpen, ClipboardList, Copy, FileText, Mic, MessageSquareText, Sparkles } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError, apiRequest } from '@/lib/api'
import { featureDescriptions, featureHelperTexts, featureInputLabels } from '@/lib/i18n'
import { getFeatureLabel } from '@/lib/format'
import { getUzToastError } from '@/lib/toast'

const generatorFeatures = FEATURE_DEFINITIONS.filter((feature) => feature.key !== 'pdf_export')

const featureIcons: Record<string, typeof Sparkles> = {
  quiz: ClipboardList,
  lesson_plan: BookOpen,
  writing_feedback: MessageSquareText,
  speaking_questions: Mic,
}

export function GeneratorPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFeature = (searchParams.get('feature') as FeatureKey) ?? 'quiz'
  const [featureKey, setFeatureKey] = useState<FeatureKey>(initialFeature)
  const [topic, setTopic] = useState('')
  const [gradeOrLevel, setGradeOrLevel] = useState('')
  const [additionalInstructions, setAdditionalInstructions] = useState('')

  const activeFeature = useMemo(
    () => generatorFeatures.find((feature) => feature.key === featureKey) ?? generatorFeatures[0],
    [featureKey],
  )

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest<GeneratorResponse>('/teacher/generate', {
        method: 'POST',
        body: JSON.stringify({
          featureKey,
          topic,
          gradeOrLevel: gradeOrLevel || undefined,
          additionalInstructions: additionalInstructions || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Kontent yaratildi.')
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.statusCode === 402) {
        toast.error('Kredit yetarli emas.')
        navigate('/app/billing')
        return
      }

      toast.error(getUzToastError(error, 'Kontent yaratib bo\'lmadi.'))
    },
  })

  const result = mutation.data?.content

  return (
    <div className="space-y-4 animate-in pb-8">
      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-violet-100/70 dark:to-violet-950/20">
        <CardContent className="space-y-4 p-5">
          <div>
            <div className="text-lg font-black tracking-tight">{getFeatureLabel(activeFeature.key)}</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{featureDescriptions[language][activeFeature.key]}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('generator.tool')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {generatorFeatures.map((feature) => {
                const Icon = featureIcons[feature.key] ?? Sparkles
                const isSelected = featureKey === feature.key
                return (
                  <button
                    key={feature.key}
                    type="button"
                    onClick={() => {
                      setFeatureKey(feature.key as FeatureKey)
                      setSearchParams({ feature: feature.key })
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all duration-150',
                      isSelected
                        ? 'border-primary/30 bg-primary/10 text-primary ring-2 ring-primary/15'
                        : 'border-border bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', isSelected ? 'bg-primary/15' : 'bg-secondary')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold leading-4">{getFeatureLabel(feature.key)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">{featureInputLabels[language][activeFeature.key]}</Label>
            <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={featureHelperTexts[language][activeFeature.key]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">{t('generator.classLevel')}</Label>
            <Input
              id="level"
              value={gradeOrLevel}
              onChange={(event) => setGradeOrLevel(event.target.value)}
              placeholder={t('generator.levelPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">{t('generator.additional')}</Label>
            <Textarea
              id="instructions"
              value={additionalInstructions}
              onChange={(event) => setAdditionalInstructions(event.target.value)}
              className="min-h-[110px]"
              placeholder={t('generator.optional')}
            />
          </div>

          <Button variant="gradient" className="h-14 w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !topic}>
            {mutation.isPending ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            {t('generator.generate')}
          </Button>
        </CardContent>
      </Card>

      {mutation.isPending ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-4 w-2/5 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-48 rounded-2xl" />
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black tracking-tight">{result.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{t('generator.readyHint')}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(result.outputMarkdown)
                  toast.success('Matn nusxalandi.')
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="markdown-body">
              <MarkdownRenderer>{result.outputMarkdown}</MarkdownRenderer>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to={`/app/history/${result.id}`}>
                <FileText className="h-4 w-4" />
                {t('generator.openDetail')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
