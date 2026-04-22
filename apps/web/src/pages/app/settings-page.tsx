import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, LogOut, Save, Bot } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api'
import { env } from '@/lib/env'
import { useAuth } from '@/hooks/use-auth'

interface LinkCodeResponse {
  linkCode: string
  expiresAt: string
}

export function SettingsPage() {
  const { profile, refreshProfile, logout } = useAuth()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [schoolName, setSchoolName] = useState(profile?.schoolName ?? '')
  const [gradeFocus, setGradeFocus] = useState(profile?.gradeFocus ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? '')
  const [telegramHandle, setTelegramHandle] = useState(profile?.telegramHandle ?? '')
  const [linkData, setLinkData] = useState<LinkCodeResponse | null>(null)
  const profileSnapshot = useMemo(
    () => ({
      fullName: profile?.fullName ?? '',
      schoolName: profile?.schoolName ?? '',
      gradeFocus: profile?.gradeFocus ?? '',
      timezone: profile?.timezone ?? '',
      telegramHandle: profile?.telegramHandle ?? '',
    }),
    [profile?.fullName, profile?.schoolName, profile?.gradeFocus, profile?.timezone, profile?.telegramHandle],
  )

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: fullName || null,
          schoolName: schoolName || null,
          gradeFocus: gradeFocus || null,
          timezone: timezone || null,
          telegramHandle: telegramHandle || null,
        }),
      }),
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Sozlamalar yangilandi.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Sozlamalarni yangilab bo'lmadi.")
    },
  })

  const linkMutation = useMutation({
    mutationFn: () => apiRequest<LinkCodeResponse>('/teacher/telegram/link-code', { method: 'POST' }),
    onSuccess: (data) => {
      setLinkData(data)
      toast.success('Telegram ulash kodi yaratildi.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Kod yaratib bo'lmadi.")
    },
  })

  const deepLink = env.telegramBotUsername && linkData
    ? `https://t.me/${env.telegramBotUsername}?start=link_${linkData.linkCode}`
    : null

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in pb-12">
      <PageHeader
        eyebrow="Sozlamalar"
        title="Profil va Xavfsizlik"
        description="Shaxsiy ma'lumotlaringiz va platforma sozlamalari."
      />

      {/* Profile Card */}
      <Card className="border-none bg-card/60 shadow-xl backdrop-blur-xl">
        <CardContent className="space-y-6 p-8">
          <h2 className="text-lg font-black tracking-tight">Profil ma'lumotlari</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">F.I.SH</Label>
                <Input
                  id="fullName"
                  value={fullName || profileSnapshot.fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ali Valiyev"
                  className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Maktab</Label>
                <Input
                  id="schoolName"
                  value={schoolName || profileSnapshot.schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="21-maktab"
                  className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeFocus" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Asosiy sinf</Label>
                <Input
                  id="gradeFocus"
                  value={gradeFocus || profileSnapshot.gradeFocus}
                  onChange={(e) => setGradeFocus(e.target.value)}
                  placeholder="7-sinf"
                  className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Vaqt zonasi</Label>
                <Input
                  id="timezone"
                  value={timezone || profileSnapshot.timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Tashkent"
                  className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="telegramHandle" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Telegram username</Label>
                <Input
                  id="telegramHandle"
                  value={telegramHandle || profileSnapshot.telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  placeholder="@username"
                  className="h-12 rounded-2xl"
              />
            </div>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            variant="gradient"
            className="h-12 w-full rounded-2xl font-bold"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Saqlash</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Card */}
      <Card className="border-none bg-card/60 shadow-xl backdrop-blur-xl">
        <CardContent className="space-y-5 p-8">
          <div>
            <h2 className="text-lg font-black tracking-tight">Telegram ulanishi</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground/70">Botdan foydalanish uchun hisobingizni ulang.</p>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm leading-relaxed text-muted-foreground">
            Buyruqlar: <span className="font-bold text-foreground">/start</span>, <span className="font-bold text-foreground">/quiz</span>, <span className="font-bold text-foreground">/plans</span>, <span className="font-bold text-foreground">/balance</span>
          </div>
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl font-bold border-border/40"
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending}
          >
            {linkMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yaratilmoqda...</>
            ) : (
              <><Bot className="mr-2 h-4 w-4" /> Ulash kodini yaratish</>
            )}
          </Button>

          {linkData && (
            <div className="space-y-4 rounded-2xl border border-border/40 bg-background p-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Bir martalik kod</div>
                <div className="mt-3 text-3xl font-black tracking-[0.3em]">{linkData.linkCode}</div>
              </div>
              <div className="text-xs font-medium text-muted-foreground/60">Amal qilish muddati: {linkData.expiresAt}</div>
              {deepLink && (
                <Button asChild className="w-full rounded-2xl font-bold" variant="gradient">
                  <a href={deepLink} target="_blank" rel="noreferrer">
                    <Bot className="mr-2 h-4 w-4" />
                    Telegram botni ochish
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-bold">Tizimdan chiqish</h3>
            <p className="mt-1 text-sm text-muted-foreground/70">Barcha sessiyalardan chiqiladi.</p>
          </div>
          <Button
            variant="destructive"
            className="rounded-2xl font-bold"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Chiqish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
