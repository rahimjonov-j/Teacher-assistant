import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  FEATURE_DEFINITIONS,
  TELEGRAM_FEATURE_COMMAND_MAP,
  type FeatureKey,
  type GeneratorResponse,
} from '@teacher-assistant/shared'
import { Copy, FileText, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError, apiRequest } from '@/lib/api'

const generatorFeatures = FEATURE_DEFINITIONS.filter((feature) => feature.key !== 'pdf_export')

export function GeneratorPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
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
      toast.success(t('generator.created'))
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.statusCode === 402) {
        toast.error(t('generator.creditEnded'))
        navigate('/app/billing')
        return
      }

      toast.error(error instanceof Error ? error.message : t('generator.failed'))
    },
  })

  const result = mutation.data?.content
  const activeTelegramCommand = TELEGRAM_FEATURE_COMMAND_MAP[featureKey]

  return (
    <div className="space-y-4 animate-in pb-8">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <div className="text-lg font-black tracking-tight">{activeFeature.label}</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{activeFeature.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature">{t('generator.tool')}</Label>
            <Select
              id="feature"
              value={featureKey}
              onChange={(event) => {
                const value = event.target.value as FeatureKey
                setFeatureKey(value)
                setSearchParams({ feature: value })
              }}
            >
              {generatorFeatures.map((feature) => (
                <option key={feature.key} value={feature.key}>
                  {feature.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">{activeFeature.inputLabel}</Label>
            <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={activeFeature.helperText} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">{t('generator.classLevel')}</Label>
            <Input id="level" value={gradeOrLevel} onChange={(event) => setGradeOrLevel(event.target.value)} placeholder="7-sinf" />
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

          <div className="rounded-2xl bg-secondary p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('generator.telegramCommand')}</div>
            <div className="mt-2 text-base font-black">{activeTelegramCommand.usage}</div>
            <div className="mt-1 text-sm text-muted-foreground">{activeTelegramCommand.description}</div>
          </div>

          <Button className="h-14 w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !topic}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t('generator.generate')}
          </Button>
        </CardContent>
      </Card>

      {mutation.isPending ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="h-4 w-2/5 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
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
                  toast.success(t('generator.copied'))
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="markdown-body">
              <ReactMarkdown>{result.outputMarkdown}</ReactMarkdown>
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
