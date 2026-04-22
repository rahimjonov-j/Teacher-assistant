import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, type GeneratorResponse, type FeatureKey } from '@teacher-assistant/shared'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Sparkles, Loader2, Copy, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ApiRequestError, apiRequest } from '@/lib/api'
import ReactMarkdown from 'react-markdown'

const generatorFeatures = FEATURE_DEFINITIONS.filter((feature) => feature.key !== 'pdf_export')

export function GeneratorPage() {
  const navigate = useNavigate()
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
      toast.success('Material tayyorlandi!')
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.statusCode === 402) {
        toast.error("Kredit tugagan. Obuna sahifasiga yo'naltirildingiz.")
        navigate('/app/billing')
        return
      }

      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi.")
    },
  })

  const result = mutation.data?.content

  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        eyebrow="AI Generator"
        title={activeFeature.label}
        description={activeFeature.description}
      />

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <aside className="space-y-6">
          <Card className="border-none bg-card/60 shadow-xl backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="feature" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Funksiya</Label>
                <Select 
                  id="feature" 
                  value={featureKey} 
                  onChange={(e) => {
                    const val = e.target.value as FeatureKey
                    setFeatureKey(val)
                    setSearchParams({ feature: val })
                  }}
                  className="h-12 rounded-xl"
                >
                  {generatorFeatures.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{activeFeature.inputLabel}</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={activeFeature.helperText}
                  className="h-14 rounded-2xl bg-white/50 dark:bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Sinf yoki Daraja</Label>
                <Input
                  id="level"
                  value={gradeOrLevel}
                  onChange={(e) => setGradeOrLevel(e.target.value)}
                  placeholder="Masalan: 7-sinf"
                  className="h-12 rounded-xl bg-white/50 dark:bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Qo'shimcha shartlar</Label>
                <Textarea
                  id="instructions"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Ixtiyoriy..."
                  className="min-h-[100px] rounded-2xl bg-white/50 dark:bg-black/20"
                />
              </div>

              <div className="rounded-xl bg-primary/10 p-4 text-[11px] font-bold text-primary uppercase tracking-widest text-center">
                Sarflanadigan kredit: {activeFeature.creditCost}
              </div>

              <Button
                className="h-16 w-full rounded-[24px] text-lg font-black shadow-lg shadow-primary/20"
                disabled={mutation.isPending || !topic}
                onClick={() => mutation.mutate()}
                variant="gradient"
              >
                {mutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Tayyorlanmoqda...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Yaratish
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </aside>

        <section className="min-h-[600px] space-y-6">
          {!result && !mutation.isPending && (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center opacity-40">
              <div className="mb-6 rounded-[40px] bg-secondary/50 p-12">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Tayyor material yo'q</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">Chap tarafdagi formani to'ldiring.</p>
            </div>
          )}

          {mutation.isPending && (
            <div className="space-y-6 animate-in">
              <div className="h-8 w-1/3 animate-pulse rounded-full bg-muted/60" />
              <Card className="border-none bg-card/40">
                <CardContent className="space-y-4 p-8">
                  <div className="h-4 w-full animate-pulse rounded-full bg-muted/40" />
                  <div className="h-4 w-5/6 animate-pulse rounded-full bg-muted/40" />
                  <div className="h-32 w-full animate-pulse rounded-3xl bg-muted/20" />
                </CardContent>
              </Card>
            </div>
          )}

          {result && (
            <div className="animate-in space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight">{result.title}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 border-border/40" onClick={() => {
                    navigator.clipboard.writeText(result.outputMarkdown)
                    toast.success('Nusxalandi')
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Nusxa
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-xl font-bold h-9 border-border/40">
                    <Link to={`/app/history/${result.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Batafsil
                    </Link>
                  </Button>
                </div>
              </div>
              <Card className="border-none bg-card/60 shadow-xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="markdown-body prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{result.outputMarkdown}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
