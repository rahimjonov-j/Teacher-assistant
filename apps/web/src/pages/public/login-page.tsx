import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
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
      toast.error(getUzToastError(error, 'Tizimga kirib bo\'lmadi.'))
    }
  })
  const emailField = form.register('email')

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('common.login')}</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{t('public.login.title')}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('public.login.subtitle')}</p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
            {t('public.supabaseMissing')}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Gmail</Label>
            <div className="flex overflow-hidden rounded-2xl border border-input bg-card/80 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="username"
                className="h-12 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                {...emailField}
                onChange={(event) => {
                  event.target.value = normalizeGmailUsername(event.target.value)
                  void emailField.onChange(event)
                }}
              />
              <div className="flex shrink-0 items-center border-l border-border bg-secondary px-3 text-sm font-bold text-secondary-foreground">
                {GMAIL_DOMAIN}
              </div>
            </div>
            {form.formState.errors.email ? <p className="text-xs text-muted-foreground">{form.formState.errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <Input id="password" type="password" placeholder={t('common.password')} {...form.register('password')} />
            {form.formState.errors.password ? <p className="text-xs text-muted-foreground">{form.formState.errors.password.message}</p> : null}
          </div>

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting || !isSupabaseConfigured}>
            {form.formState.isSubmitting ? <Spinner /> : null}
            {t('common.login')}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link to="/reset-password" className="font-semibold text-foreground underline-offset-4 hover:underline">
            {t('public.login.reset')}
          </Link>
          <Link to="/register" className="font-semibold text-foreground underline-offset-4 hover:underline">
            {t('public.login.register')}
          </Link>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link to="/student-login">Student login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
