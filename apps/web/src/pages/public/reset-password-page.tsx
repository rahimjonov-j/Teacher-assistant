import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/hooks/use-i18n'
import { getSupabaseClient, isSupabaseConfigured, preloadSupabaseClient } from '@/lib/supabase'
import { getUzToastError } from '@/lib/toast'

const requestSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
})

const updateSchema = z
  .object({
    password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    confirmPassword: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Parollar bir xil emas',
    path: ['confirmPassword'],
  })

type RequestValues = z.infer<typeof requestSchema>
type UpdateValues = z.infer<typeof updateSchema>

function isRecoveryUrl() {
  return window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState(() => isRecoveryUrl())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const requestForm = useForm<RequestValues>({ resolver: zodResolver(requestSchema) })
  const updateForm = useForm<UpdateValues>({ resolver: zodResolver(updateSchema) })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    void preloadSupabaseClient()

    void getSupabaseClient().then((supabase) =>
      supabase.auth.getSession().then(({ data }) => {
        if (data.session && isRecoveryUrl()) {
          setHasRecoverySession(true)
        }
      }),
    )
  }, [])

  const onRequestReset = requestForm.handleSubmit(async (values) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }

      setResetEmailSent(true)
      toast.success('Tiklash havolasi emailingizga yuborildi.')
    } catch (error) {
      toast.error(getUzToastError(error, 'Tiklash havolasini yuborib bo\'lmadi.'))
    }
  })

  const onUpdatePassword = updateForm.handleSubmit(async (values) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password: values.password })

      if (error) {
        throw new Error(error.message)
      }

      toast.success('Parol yangilandi.')
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      toast.error(getUzToastError(error, 'Parolni yangilab bo\'lmadi.'))
    }
  })

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#15151a] p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6f833]">{t('public.login.reset')}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{t('public.reset.title')}</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            {hasRecoverySession ? t('public.reset.subtitle.update') : t('public.reset.subtitle.request')}
          </p>
        </div>

        {hasRecoverySession ? (
          <form onSubmit={onUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">{t('public.password.new')}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} className="border-white/10 bg-white/[0.04] pr-12 text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" {...updateForm.register('password')} />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/80">{t('public.password.confirm')}</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="border-white/10 bg-white/[0.04] pr-12 text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" {...updateForm.register('confirmPassword')} />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full bg-[#c6f833] text-[#0a0a0c] shadow-[0_14px_32px_-16px_rgba(198,248,51,0.6)] hover:bg-[#b4e81f]" disabled={updateForm.formState.isSubmitting || !isSupabaseConfigured}>
              {updateForm.formState.isSubmitting ? <Spinner /> : null}
              {t('public.password.update')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onRequestReset} className="space-y-4">
            {resetEmailSent ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                {t('public.reset.sentHint')}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input id="email" type="email" placeholder="teacher@school.uz" className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" {...requestForm.register('email')} />
            </div>
              <Button type="submit" className="h-12 w-full bg-[#c6f833] text-[#0a0a0c] shadow-[0_14px_32px_-16px_rgba(198,248,51,0.6)] hover:bg-[#b4e81f]" disabled={requestForm.formState.isSubmitting || !isSupabaseConfigured}>
                {requestForm.formState.isSubmitting ? <Spinner /> : null}
                {t('public.password.sendLink')}
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link to="/login" className="font-semibold text-[#c6f833] underline-offset-4 hover:underline">
              {t('public.reset.back')}
            </Link>
          </div>
      </div>
    </div>
  )
}
