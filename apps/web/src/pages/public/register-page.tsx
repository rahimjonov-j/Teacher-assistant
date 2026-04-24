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
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  schoolName: z.string().min(2, "Maktab nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useI18n()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await register(values)

      if (result.emailConfirmationRequired) {
        toast.success(t('public.register.confirmEmail'))
        navigate('/login')
        return
      }

      toast.success(t('public.register.created'))
      navigate(result.profile?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('public.register.failed'))
    }
  })

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('common.register')}</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{t('public.register.title')}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('public.register.subtitle')}</p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
            {t('public.supabaseMissing')}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('settings.fullName')}</Label>
            <Input id="fullName" placeholder="Ali Valiyev" {...form.register('fullName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolName">{t('settings.school')}</Label>
            <Input id="schoolName" placeholder="21-maktab" {...form.register('schoolName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="teacher@school.uz" {...form.register('email')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <Input id="password" type="password" placeholder={t('common.password')} {...form.register('password')} />
          </div>

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting || !isSupabaseConfigured}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('common.register')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            {t('public.register.haveAccount')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
