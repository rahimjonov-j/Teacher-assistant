import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  Lock,
  Moon,
  Save,
  Shield,
  SunMedium,
  UserCircle2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'
import { getUzToastError } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

type SectionKey = 'profile' | 'account' | 'notifications' | 'privacy' | 'language' | 'theme' | 'help' | 'about'

const settingsSections: Array<{
  key: SectionKey
  icon: typeof UserCircle2
}> = [
  { key: 'profile', icon: UserCircle2 },
  { key: 'account', icon: Shield },
  { key: 'notifications', icon: Bell },
  { key: 'privacy', icon: Lock },
  { key: 'language', icon: Globe },
  { key: 'theme', icon: SunMedium },
  { key: 'help', icon: HelpCircle },
  { key: 'about', icon: Info },
]

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<SectionKey | null>('profile')
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [schoolName, setSchoolName] = useState(profile?.schoolName ?? '')
  const [gradeFocus, setGradeFocus] = useState(profile?.gradeFocus ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? '')

  const profileSnapshot = useMemo(
    () => ({
      fullName: profile?.fullName ?? '',
      schoolName: profile?.schoolName ?? '',
      gradeFocus: profile?.gradeFocus ?? '',
      timezone: profile?.timezone ?? '',
    }),
    [profile?.fullName, profile?.schoolName, profile?.gradeFocus, profile?.timezone],
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
        }),
      }),
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Profil saqlandi.')
    },
    onError: (error) => {
      toast.error(getUzToastError(error, "Profilni saqlab bo'lmadi."))
    },
  })

  const currentTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const currentThemeLabel = currentTheme === 'dark' ? t('common.dark') : t('common.light')
  const isDarkTheme = currentTheme === 'dark'

  const toggleSection = (section: SectionKey) => {
    setActiveSection((current) => (current === section ? null : section))
  }

  function renderSectionContent(sectionKey: SectionKey) {
    if (sectionKey === 'profile') {
      return (
        <div className="space-y-4 border-t border-border/70 px-4 pb-4 pt-4">
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
            {saveMutation.isPending ? <Spinner /> : <Save className="h-4 w-4" />}
            {t('settings.saveProfile')}
          </Button>
        </div>
      )
    }

    if (sectionKey === 'account') {
      return (
        <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-4">
          <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
            {t('settings.privacyEmail')}: <span className="font-semibold text-foreground">{profile?.email ?? '-'}</span>
          </div>
        </div>
      )
    }

    if (sectionKey === 'notifications') {
      return (
        <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-4">
          <p className="text-sm leading-6 text-muted-foreground">{t('settings.notificationsHint')}</p>
        </div>
      )
    }

    if (sectionKey === 'privacy') {
      return (
        <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-4">
          <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
            {t('settings.privacyEmail')}: <span className="font-semibold text-foreground">{profile?.email ?? '-'}</span>
          </div>
        </div>
      )
    }

    if (sectionKey === 'language' || sectionKey === 'theme') {
      return null
    }

    if (sectionKey === 'help') {
      return (
        <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-4">
          <div className="rounded-2xl border border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
            {t('settings.helpHint')}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-4">
        <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {t('settings.aboutTitle')}
        </div>
        <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {t('settings.aboutHint')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in pb-8">
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            {settingsSections.map((section) => {
              const hasInlineControl = section.key === 'language' || section.key === 'theme'
              const isActive = !hasInlineControl && activeSection === section.key

              return (
                <div
                  key={section.key}
                  className={cn(
                    'overflow-hidden rounded-[28px] border transition-colors',
                    isActive ? 'border-border bg-card' : 'border-transparent bg-background hover:bg-secondary/60',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasInlineControl) {
                        toggleSection(section.key)
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', isActive ? 'bg-foreground text-background' : 'bg-secondary')}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black">{t(`settings.${section.key}`)}</div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">{t(`settings.${section.key}Subtitle`)}</div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {section.key === 'language' ? (
                        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <Select
                            aria-label={t('common.language')}
                            value={language}
                            onChange={(event) => setLanguage(event.target.value as typeof language)}
                            className="h-10 w-[120px] rounded-xl border-border bg-background pr-9 text-xs font-semibold"
                          >
                            <option value="uz">{t('common.uzbek')}</option>
                            <option value="en">{t('common.english')}</option>
                          </Select>
                        </div>
                      ) : null}

                      {section.key === 'theme' ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setTheme(isDarkTheme ? 'light' : 'dark')
                          }}
                          className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5"
                          aria-label={t('settings.theme')}
                        >
                          <span
                            className={cn(
                              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                              isDarkTheme ? 'bg-foreground' : 'bg-secondary',
                            )}
                          >
                            <span
                              className={cn(
                                'absolute left-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform',
                                isDarkTheme && 'translate-x-5',
                              )}
                            >
                              {isDarkTheme ? <Moon className="h-3 w-3" /> : <SunMedium className="h-3 w-3" />}
                            </span>
                          </span>
                          <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">{currentThemeLabel}</span>
                        </button>
                      ) : null}

                      {!hasInlineControl ? (
                        <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isActive && 'rotate-90')} />
                      ) : null}
                    </div>
                  </button>

                  {isActive ? renderSectionContent(section.key) : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
