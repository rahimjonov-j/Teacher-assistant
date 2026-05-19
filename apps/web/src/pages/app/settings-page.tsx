import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Bell,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()
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

  const isDarkTheme = resolvedTheme === 'dark'
  const currentThemeLabel = isDarkTheme ? t('common.dark') : t('common.light')

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'T'

  return (
    <div className="space-y-4 animate-in pb-8">

      {/* ── Profile hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-violet-700 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_65%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-black text-white backdrop-blur-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-black text-white">{profile?.fullName || 'Teacher'}</div>
            <div className="mt-0.5 truncate text-xs text-white/60">{profile?.email ?? ''}</div>
            {profile?.schoolName ? (
              <div className="mt-0.5 truncate text-[11px] text-white/50">{profile.schoolName}</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Profile form ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <UserCircle2 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-black">{t('settings.profile')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.profileSubtitle')}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm font-semibold">{t('settings.fullName')}</Label>
            <Input
              id="fullName"
              value={fullName || profileSnapshot.fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolName" className="text-sm font-semibold">{t('settings.school')}</Label>
            <Input
              id="schoolName"
              value={schoolName || profileSnapshot.schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gradeFocus" className="text-sm font-semibold">{t('settings.grade')}</Label>
            <Input
              id="gradeFocus"
              value={gradeFocus || profileSnapshot.gradeFocus}
              onChange={(e) => setGradeFocus(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-sm font-semibold">{t('settings.timezone')}</Label>
            <Input
              id="timezone"
              value={timezone || profileSnapshot.timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={cn(
              'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all',
              saveMutation.isPending
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-primary shadow-sm hover:opacity-90 active:scale-[0.98]',
            )}
          >
            {saveMutation.isPending ? <Spinner /> : <Save className="h-4 w-4" />}
            {t('settings.saveProfile')}
          </button>
        </div>
      </div>

      {/* ── Account ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-black">{t('settings.account')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.accountSubtitle')}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <div className="text-xs text-muted-foreground">{t('settings.privacyEmail')}</div>
          <div className="mt-0.5 text-sm font-semibold">{profile?.email ?? '-'}</div>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30">
            {isDarkTheme ? (
              <Moon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            ) : (
              <SunMedium className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            )}
          </div>
          <div>
            <div className="text-sm font-black">{t('settings.theme')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.themeSubtitle')}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all',
              !isDarkTheme
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <SunMedium className="h-4 w-4" />
            {t('common.light')}
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all',
              isDarkTheme
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Moon className="h-4 w-4" />
            {t('common.dark')}
          </button>
        </div>
      </div>

      {/* ── Language ── */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
            <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black">{t('settings.language')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.languageSubtitle')}</div>
          </div>
          <Select
            aria-label={t('common.language')}
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="h-10 w-[130px] rounded-xl border-border bg-background pr-9 text-xs font-semibold"
          >
            <option value="uz">{t('common.uzbek')}</option>
            <option value="en">{t('common.english')}</option>
          </Select>
        </div>
      </div>

      {/* ── Help + About ── */}
      <div className="space-y-2.5">
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
              <HelpCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm font-black">{t('settings.help')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.helpSubtitle')}</div>
            </div>
          </div>
          <p className="rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {t('settings.helpHint')}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <div className="text-sm font-black">{t('settings.about')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.aboutTitle')}</div>
            </div>
          </div>
        </div>

        {/* ── Misc ── */}
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Bell className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black">{t('settings.notifications')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.notificationsSubtitle')}</div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('settings.notificationsHint')}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <div className="text-sm font-black">{t('settings.privacy')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.privacySubtitle')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
