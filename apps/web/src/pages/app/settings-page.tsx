import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { TELEGRAM_COMMAND_DEFINITIONS } from '@teacher-assistant/shared'
import {
  Bell,
  Bot,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  LogOut,
  Save,
  Shield,
  UserCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { apiRequest } from '@/lib/api'
import { env } from '@/lib/env'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/hooks/use-i18n'

interface LinkCodeResponse {
  linkCode: string
  expiresAt: string
}

type SectionKey = 'profile' | 'account' | 'notifications' | 'privacy' | 'language' | 'help' | 'about'

const settingsSections: Array<{
  key: SectionKey
  title: string
  subtitle: string
  icon: typeof UserCircle2
}> = [
  { key: 'profile', title: 'Profile', subtitle: 'Name, school and class focus', icon: UserCircle2 },
  { key: 'account', title: 'Account', subtitle: 'Telegram connection and access', icon: Shield },
  { key: 'notifications', title: 'Notifications', subtitle: 'Command and message preferences', icon: Bell },
  { key: 'privacy', title: 'Privacy', subtitle: 'Session and linked account info', icon: Lock },
  { key: 'language', title: 'Language', subtitle: 'Interface locale and timezone', icon: Globe },
  { key: 'help', title: 'Help & Support', subtitle: 'How to use Telegram commands', icon: HelpCircle },
  { key: 'about', title: 'About', subtitle: 'Platform and version information', icon: Info },
]

export function SettingsPage() {
  const { profile, refreshProfile, logout } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const [activeSection, setActiveSection] = useState<SectionKey>('profile')
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
      toast.success(t('settings.profileSaved'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('settings.profileSaveFailed'))
    },
  })

  const linkMutation = useMutation({
    mutationFn: () => apiRequest<LinkCodeResponse>('/teacher/telegram/link-code', { method: 'POST' }),
    onSuccess: (data) => {
      setLinkData(data)
      toast.success(t('settings.linkCreated'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('settings.linkFailed'))
    },
  })

  const deepLink = env.telegramBotUsername && linkData
    ? `https://t.me/${env.telegramBotUsername}?start=link_${linkData.linkCode}`
    : null

  return (
    <div className="space-y-4 animate-in pb-8">
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            {settingsSections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">{t(`settings.${section.key}`)}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{t(`settings.${section.key}Subtitle`)}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeSection === 'profile' ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.profile')}</div>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('settings.fullName')}</Label>
              <Input id="fullName" value={fullName || profileSnapshot.fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolName">{t('settings.school')}</Label>
              <Input id="schoolName" value={schoolName || profileSnapshot.schoolName} onChange={(event) => setSchoolName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeFocus">{t('settings.grade')}</Label>
              <Input id="gradeFocus" value={gradeFocus || profileSnapshot.gradeFocus} onChange={(event) => setGradeFocus(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('settings.timezone')}</Label>
              <Input id="timezone" value={timezone || profileSnapshot.timezone} onChange={(event) => setTimezone(event.target.value)} />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('settings.saveProfile')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === 'account' ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.account')}</div>
            <div className="space-y-2">
              <Label htmlFor="telegramHandle">{t('settings.telegramUsername')}</Label>
              <Input
                id="telegramHandle"
                value={telegramHandle || profileSnapshot.telegramHandle}
                onChange={(event) => setTelegramHandle(event.target.value)}
                placeholder="@username"
              />
            </div>
            <Button variant="outline" onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending} className="w-full">
              {linkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {t('settings.createLinkCode')}
            </Button>

            {linkData ? (
              <div className="rounded-2xl border border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('settings.oneTimeCode')}</div>
                <div className="mt-3 text-2xl font-black tracking-[0.22em]">{linkData.linkCode}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t('settings.expiresAt')}: {linkData.expiresAt}</div>
                {deepLink ? (
                  <Button asChild className="mt-4 w-full">
                    <a href={deepLink} target="_blank" rel="noreferrer">
                      {t('settings.openBot')}
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {activeSection === 'notifications' ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.notifications')}</div>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('settings.notificationsHint')}
            </p>
            <div className="grid gap-2">
              {TELEGRAM_COMMAND_DEFINITIONS.map((command) => (
                <div key={command.command} className="rounded-2xl border border-border px-3 py-3">
                  <div className="text-sm font-black">{command.usage}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t(`commands.${command.command}`)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === 'privacy' ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.privacy')}</div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {t('settings.privacyEmail')}: <span className="font-semibold text-foreground">{profile?.email ?? '-'}</span>
            </div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {t('settings.privacyTelegram')}: <span className="font-semibold text-foreground">{profile?.telegramHandle ?? t('settings.notLinked')}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === 'language' ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.language')}</div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {t('settings.languageHint')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('common.language')}</Label>
              <Select id="language" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
                <option value="uz">{t('common.uzbek')}</option>
                <option value="en">{t('common.english')}</option>
              </Select>
            </div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {t('settings.timezone')}: <span className="font-semibold text-foreground">{profile?.timezone ?? 'Asia/Tashkent'}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === 'help' ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.help')}</div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
              {t('settings.helpHint')}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeSection === 'about' ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="text-lg font-black tracking-tight">{t('settings.about')}</div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {t('settings.aboutTitle')}
            </div>
            <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {t('settings.aboutHint')}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button variant="outline" className="h-12 w-full" onClick={() => logout()}>
        <LogOut className="h-4 w-4" />
        {t('common.logout')}
      </Button>
    </div>
  )
}
