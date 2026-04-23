import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, GraduationCap, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState(() => isRecoveryUrl())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
  })
  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    const isRecovery = isRecoveryUrl()

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && isRecovery) {
        setHasRecoverySession(true)
      }
    })
  }, [])

  const onRequestReset = requestForm.handleSubmit(async (values) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }

      setResetEmailSent(true)
      toast.success('Parolni yangilash linki emailingizga yuborildi.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset link yuborib bo'lmadi.")
    }
  })

  const onUpdatePassword = updateForm.handleSubmit(async (values) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })

      if (error) {
        throw new Error(error.message)
      }

      toast.success('Parol yangilandi. Qayta kirishingiz mumkin.')
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Parolni yangilab bo'lmadi.")
    }
  })

  return (
    <div className="container relative flex min-h-[calc(100vh-80px)] items-center justify-center py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <Card className="w-full max-w-[440px] overflow-hidden border-white/20 bg-white/40 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/40 animate-in">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-sky-500 to-primary" />
        <CardHeader className="space-y-4 p-8 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-tr from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
            {resetEmailSent ? <MailCheck className="h-9 w-9" /> : <GraduationCap className="h-9 w-9" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight">Parolni yangilash</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground/70">
              {hasRecoverySession
                ? 'Yangi parol kiriting va hisobingizga qayta kiring.'
                : 'Emailingizni kiriting, parolni yangilash linkini yuboramiz.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-xl bg-amber-500/10 p-4 text-xs font-bold text-amber-600 dark:text-amber-400">
              Supabase ulanmagan. Parolni yangilash ishlashi uchun muhit o'zgaruvchilarini sozlang.
            </div>
          )}

          {hasRecoverySession ? (
            <form onSubmit={onUpdatePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Yangi parol</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-14 rounded-2xl bg-white/50 pr-12 dark:bg-black/20"
                    {...updateForm.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {updateForm.formState.errors.password && (
                  <p className="ml-1 text-[10px] font-bold text-destructive">{updateForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Parolni tasdiqlang</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="h-14 rounded-2xl bg-white/50 pr-12 dark:bg-black/20"
                    {...updateForm.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {updateForm.formState.errors.confirmPassword && (
                  <p className="ml-1 text-[10px] font-bold text-destructive">{updateForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-[20px] text-lg font-black shadow-lg shadow-primary/20"
                disabled={updateForm.formState.isSubmitting || !isSupabaseConfigured}
                variant="gradient"
              >
                {updateForm.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Parolni yangilash'}
              </Button>
            </form>
          ) : (
            <form onSubmit={onRequestReset} className="space-y-5">
              {resetEmailSent ? (
                <div className="rounded-2xl bg-primary/10 p-4 text-sm font-semibold text-primary">
                  Emailingizni tekshiring. Link orqali qaytib, yangi parol o'rnatasiz.
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.uz"
                  className="h-14 rounded-2xl bg-white/50 dark:bg-black/20"
                  {...requestForm.register('email')}
                />
                {requestForm.formState.errors.email && (
                  <p className="ml-1 text-[10px] font-bold text-destructive">{requestForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-[20px] text-lg font-black shadow-lg shadow-primary/20"
                disabled={requestForm.formState.isSubmitting || !isSupabaseConfigured}
                variant="gradient"
              >
                {requestForm.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Emailga link yuborish'}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-bold text-primary hover:underline">
              Kirish sahifasiga qaytish
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
