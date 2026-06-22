import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  email: z.string().min(1, 'Gmail nomini kiriting.').regex(/^[a-z0-9._%+-]+$/i, "Gmail nomi noto'g'ri."),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  schoolName: z.string().min(2, "Maktab nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useI18n()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    void preloadSupabaseClient()
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await register({
        ...values,
        email: toGmailAddress(values.email),
      })

      if (result.emailConfirmationRequired) {
        toast.success('Tasdiqlash havolasi emailingizga yuborildi.')
        navigate('/login')
        return
      }

      toast.success("Ro'yxatdan o'tish yakunlandi.")
      navigate(result.profile?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard')
    } catch (error) {
      toast.error(getUzToastError(error, "Ro'yxatdan o'tib bo'lmadi."))
    }
  })
  const emailField = form.register('email')

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#15151a] p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6f833]">{t('common.register')}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{t('public.register.title')}</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">{t('public.register.subtitle')}</p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55">
            {t('public.supabaseMissing')}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white/80">{t('settings.fullName')}</Label>
            <Input id="fullName" placeholder="Ali Valiyev" className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" {...form.register('fullName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolName" className="text-white/80">{t('settings.school')}</Label>
            <Input id="schoolName" placeholder="21-maktab" className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" {...form.register('schoolName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Gmail</Label>
            <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] focus-within:border-[#c6f833] focus-within:ring-2 focus-within:ring-[#c6f833]/20">
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="username"
                className="h-12 rounded-none border-0 bg-transparent text-white shadow-none placeholder:text-white/30 focus-visible:ring-0"
                {...emailField}
                onChange={(event) => {
                  event.target.value = normalizeGmailUsername(event.target.value)
                  void emailField.onChange(event)
                }}
              />
              <div className="flex shrink-0 items-center border-l border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white/50">
                {GMAIL_DOMAIN}
              </div>
            </div>
            {form.formState.errors.email ? <p className="text-xs text-red-400">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">{t('common.password')}</Label>
            <Input id="password" type="password" placeholder={t('common.password')} className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" {...form.register('password')} />
          </div>

          <Button type="submit" className="h-12 w-full bg-[#c6f833] text-[#0a0a0c] shadow-[0_14px_32px_-16px_rgba(198,248,51,0.6)] hover:bg-[#b4e81f]" disabled={form.formState.isSubmitting || !isSupabaseConfigured}>
            {form.formState.isSubmitting ? <Spinner /> : null}
            {t('common.register')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link to="/login" className="font-semibold text-[#c6f833] underline-offset-4 hover:underline">
            {t('public.register.haveAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
