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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError, apiRequest } from '@/lib/api'
import { featureDescriptions, featureHelperTexts, featureInputLabels } from '@/lib/i18n'
import { getFeatureLabel } from '@/lib/format'
import { getUzToastError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const generatorFeatures = FEATURE_DEFINITIONS.filter((f) => f.key !== 'pdf_export')

const featureIcons: Record<string, typeof Sparkles> = {
  quiz: ClipboardList,
  lesson_plan: BookOpen,
  writing_feedback: MessageSquareText,
  speaking_questions: Mic,
}

const featureColors: Record<string, { bg: string; activeBg: string; icon: string; ring: string }> = {
  quiz: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    activeBg: 'bg-indigo-600',
    icon: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500/40',
  },
  lesson_plan: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    activeBg: 'bg-violet-600',
    icon: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-500/40',
  },
  writing_feedback: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    activeBg: 'bg-emerald-600',
    icon: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/40',
  },
  speaking_questions: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    activeBg: 'bg-orange-500',
    icon: 'text-orange-500 dark:text-orange-400',
    ring: 'ring-orange-500/40',
  },
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
    () => generatorFeatures.find((f) => f.key === featureKey) ?? generatorFeatures[0],
    [featureKey],
  )

  const colors = featureColors[featureKey] ?? featureColors.quiz
  const Icon = featureIcons[featureKey] ?? Sparkles

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
    onSuccess: () => toast.success('Kontent yaratildi.'),
    onError: (error) => {
      if (error instanceof ApiRequestError && error.statusCode === 402) {
        toast.error('Kredit yetarli emas.')
        navigate('/app/billing')
        return
      }
      toast.error(getUzToastError(error, "Kontent yaratib bo'lmadi."))
    },
  })

  const result = mutation.data?.content

  return (
    <div className="space-y-4 animate-in pb-8">

      {/* ── Feature selector ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {generatorFeatures.map((feature) => {
          const FIcon = featureIcons[feature.key] ?? Sparkles
          const fc = featureColors[feature.key] ?? featureColors.quiz
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
                'flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all duration-150',
                isSelected
                  ? `border-transparent ${fc.activeBg} text-white shadow-lg ring-2 ${fc.ring}`
                  : 'border-border bg-card hover:bg-muted',
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                isSelected ? 'bg-white/20' : fc.bg,
              )}>
                <FIcon className={cn('h-4.5 w-4.5', isSelected ? 'text-white' : fc.icon)} />
              </div>
              <span className={cn('text-xs font-bold leading-snug', isSelected ? 'text-white' : 'text-foreground')}>
                {getFeatureLabel(feature.key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Active feature info + Form ── */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Feature header */}
        <div className={cn('flex items-center gap-3 px-5 py-4', colors.bg)}>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colors.activeBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black">{getFeatureLabel(activeFeature.key)}</div>
            <div className="text-xs text-muted-foreground">{featureDescriptions[language][activeFeature.key]}</div>
          </div>
          <div className="ml-auto rounded-xl bg-background/60 px-3 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur-sm">
            {activeFeature.creditCost} kredit
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="topic" className="text-sm font-semibold">
              {featureInputLabels[language][activeFeature.key]}
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={featureHelperTexts[language][activeFeature.key]}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="level" className="text-sm font-semibold">{t('generator.classLevel')}</Label>
            <Input
              id="level"
              value={gradeOrLevel}
              onChange={(e) => setGradeOrLevel(e.target.value)}
              placeholder={t('generator.levelPlaceholder')}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instructions" className="text-sm font-semibold">
              {t('generator.additional')}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">{t('generator.optional')}</span>
            </Label>
            <Textarea
              id="instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="min-h-[90px] rounded-xl"
              placeholder="Qo'shimcha ko'rsatmalar..."
            />
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !topic.trim()}
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all',
              mutation.isPending || !topic.trim()
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : `${colors.activeBg} shadow-lg hover:opacity-90 active:scale-[0.98]`,
            )}
          >
            {mutation.isPending ? (
              <><Spinner /><span>Yaratilmoqda...</span></>
            ) : (
              <><Sparkles className="h-4 w-4" /><span>{t('generator.generate')}</span></>
            )}
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {mutation.isPending ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5">
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/5 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-4 w-3/5 rounded-full" />
          </div>
        </div>
      ) : null}

      {/* ── Result ── */}
      {result ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-black">{result.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t('generator.readyHint')}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(result.outputMarkdown)
                  toast.success('Matn nusxalandi.')
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="markdown-body p-5">
            <MarkdownRenderer>{result.outputMarkdown}</MarkdownRenderer>
          </div>
          <div className="border-t border-border p-4">
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link to={`/app/history/${result.id}`}>
                <FileText className="h-4 w-4" />
                {t('generator.openDetail')}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
