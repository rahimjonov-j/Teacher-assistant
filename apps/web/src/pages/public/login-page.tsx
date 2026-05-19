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
    <div className="w-full overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
      {/* Gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-700 px-6 py-7">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">
              {t('common.login')}
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              {t('public.login.title')}
            </h1>
          </div>
        </div>
        <p className="relative mt-3 text-sm leading-relaxed text-white/70">
          {t('public.login.subtitle')}
        </p>
      </div>

      <div className="space-y-5 p-6">
        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            {t('public.supabaseMissing')}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold">Gmail</Label>
            <div className="flex overflow-hidden rounded-xl border border-input bg-background shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="username"
                className="h-11 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                {...emailField}
                onChange={(event) => {
                  event.target.value = normalizeGmailUsername(event.target.value)
                  void emailField.onChange(event)
                }}
              />
              <div className="flex shrink-0 items-center border-l border-border bg-muted px-3 text-xs font-bold text-muted-foreground">
                {GMAIL_DOMAIN}
              </div>
            </div>
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-semibold">{t('common.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 rounded-xl"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl font-semibold"
            disabled={form.formState.isSubmitting || !isSupabaseConfigured}
          >
            {form.formState.isSubmitting ? <Spinner /> : null}
            {t('common.login')}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link
            to="/reset-password"
            className="font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('public.login.reset')}
          </Link>
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t('public.login.register')}
          </Link>
        </div>

        <div className="border-t border-border pt-4">
          <Button asChild variant="outline" className="h-10 w-full rounded-xl text-sm font-semibold">
            <Link to="/student-login">Student login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
