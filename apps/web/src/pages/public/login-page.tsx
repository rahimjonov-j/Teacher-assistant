import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useI18n()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const profile = await login(values.email, values.password)
      toast.success(t('public.login.welcomeBack'))
      navigate(profile.role === 'admin' ? '/admin/dashboard' : '/app/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('public.login.failed'))
    }
  })

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
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="teacher@school.uz" {...form.register('email')} />
            {form.formState.errors.email ? <p className="text-xs text-muted-foreground">{form.formState.errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <Input id="password" type="password" placeholder={t('common.password')} {...form.register('password')} />
            {form.formState.errors.password ? <p className="text-xs text-muted-foreground">{form.formState.errors.password.message}</p> : null}
          </div>

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting || !isSupabaseConfigured}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
      </CardContent>
    </Card>
  )
}
