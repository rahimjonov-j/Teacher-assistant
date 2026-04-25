import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Check, Copy, ExternalLink, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { apiRequest } from '@/lib/api'
import { env } from '@/lib/env'

interface LinkCodeResponse {
  linkCode: string
  expiresAt: string
}

export function TelegramLinkPage() {
  const [linkData, setLinkData] = useState<LinkCodeResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const linkMutation = useMutation({
    mutationFn: () => apiRequest<LinkCodeResponse>('/teacher/telegram/link-code', { method: 'POST' }),
    onSuccess: (data) => {
      setCopied(false)
      setLinkData(data)
      toast.success('Telegram kodi yaratildi.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Kod yaratilmadi.')
    },
  })

  const deepLink = useMemo(() => {
    if (!env.telegramBotUsername || !linkData) {
      return null
    }

    return `https://t.me/${env.telegramBotUsername}?start=link_${linkData.linkCode}`
  }, [linkData])

  const copyCode = async () => {
    if (!linkData) {
      return
    }

    await navigator.clipboard.writeText(linkData.linkCode)
    setCopied(true)
    toast.success('Kod nusxalandi.')
  }

  return (
    <div className="space-y-5 animate-in pb-8">
      <PageHeader
        eyebrow="Telegram"
        title="Telegram kodni olish"
        description="Web ilovadan ro‘yxatdan o‘tgan hisobingizni Telegram bot bilan ulang. Kod yarating, keyin Telegramga o‘tib ulanishni yakunlang."
      />

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary">
              <KeyRound className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-black">Ulanish kodi</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Kod bir martalik. Uni botga yuboring yoki Telegram tugmasi orqali avtomatik ulang.
              </p>
            </div>
          </div>

          <Button onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending} className="h-12 w-full">
            {linkMutation.isPending ? <Spinner /> : <KeyRound className="h-4 w-4" />}
            Kod yaratish
          </Button>

          {linkData ? (
            <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline">Bir martalik kod</Badge>
                <span className="text-xs text-muted-foreground">20 daqiqa amal qiladi</span>
              </div>

              <div className="rounded-2xl bg-secondary px-4 py-5 text-center">
                <div className="text-3xl font-black tracking-[0.24em]">{linkData.linkCode}</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={copyCode} className="h-11">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Nusxalandi' : 'Koddan nusxa olish'}
                </Button>

                {deepLink ? (
                  <Button asChild className="h-11">
                    <a href={deepLink} target="_blank" rel="noreferrer">
                      <Bot className="h-4 w-4" />
                      Telegramda ulash
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button disabled className="h-11">
                    <Bot className="h-4 w-4" />
                    Telegram bot sozlanmagan
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
