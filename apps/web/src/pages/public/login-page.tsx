import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { GMAIL_DOMAIN, normalizeGmailUsername, toGmailAddress } from '@/lib/gmail'
import { isSupabaseConfigured, preloadSupabaseClient } from '@/lib/supabase'
import { getUzToastError } from '@/lib/toast'

const schema = z.object({
  email: z.string().min(1, 'Gmail nomini kiriting.').regex(/^[a-z0-9._%+-]+$/i, "Gmail nomi noto'g'ri."),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useI18n()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    void preloadSupabaseClient()
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const profile = await login(toGmailAddress(values.email), values.password)
      toast.success('Xush kelibsiz.')
      navigate(profile.role === 'admin' ? '/admin/dashboard' : '/app/dashboard')
    } catch (error) {
      toast.error(getUzToastError(error, "Tizimga kirib bo'lmadi."))
    }
  })

  const emailField = form.register('email')

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#15151a] shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#c6f833] shadow-[0_0_24px_-4px_rgba(198,248,51,0.5)]">
            <GraduationCap className="h-6 w-6 text-[#0a0a0c]" />
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6f833]">
              {t('common.login')}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t('public.login.title')}
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          {t('public.login.subtitle')}
        </p>
      </div>

      <div className="space-y-5 p-6">
        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55">
            {t('public.supabaseMissing')}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-white/80">Gmail</Label>
            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-[#c6f833] focus-within:ring-2 focus-within:ring-[#c6f833]/20">
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="username"
                className="h-11 rounded-none border-0 bg-transparent text-white shadow-none placeholder:text-white/30 focus-visible:ring-0"
                {...emailField}
                onChange={(event) => {
                  event.target.value = normalizeGmailUsername(event.target.value)
                  void emailField.onChange(event)
                }}
              />
              <div className="flex shrink-0 items-center border-l border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/50">
                {GMAIL_DOMAIN}
              </div>
            </div>
            {form.formState.errors.email ? (
              <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-semibold text-white/80">{t('common.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-[#c6f833] font-semibold text-[#0a0a0c] shadow-[0_14px_32px_-16px_rgba(198,248,51,0.6)] hover:bg-[#b4e81f]"
            disabled={form.formState.isSubmitting || !isSupabaseConfigured}
          >
            {form.formState.isSubmitting ? <Spinner /> : null}
            {t('common.login')}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link
            to="/reset-password"
            className="font-semibold text-white/55 underline-offset-4 hover:text-white hover:underline"
          >
            {t('public.login.reset')}
          </Link>
          <Link
            to="/register"
            className="font-semibold text-[#c6f833] underline-offset-4 hover:underline"
          >
            {t('public.login.register')}
          </Link>
        </div>

        <div className="border-t border-white/10 pt-4">
          <Button
            asChild
            variant="outline"
            className="h-10 w-full rounded-xl border-white/15 bg-transparent text-sm font-semibold text-white hover:border-[#c6f833] hover:bg-white/[0.03] hover:text-[#c6f833]"
          >
            <Link to="/student-login">O‘quvchi kirishi</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
