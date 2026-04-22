import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { UserPlus2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Noto\'g\'ri email format'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  schoolName: z.string().min(2, 'Maktab nomi kamida 2 ta belgidan iborat bo\'lishi kerak'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await register(values)

      if (result.emailConfirmationRequired) {
        toast.success("Hisob yaratildi. Email tasdiqlangandan keyin kirishingiz mumkin.")
        navigate('/login')
        return
      }

      toast.success("Hisob yaratildi. Xush kelibsiz!")
      navigate(result.profile?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hisob yaratib bo'lmadi.")
    }
  })

  return (
    <div className="container relative flex min-h-[calc(100vh-80px)] items-center justify-center py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>
      
      <Card className="w-full max-w-[500px] overflow-hidden border-white/20 bg-white/40 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/40 animate-in">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-primary" />
        <CardHeader className="space-y-4 p-8 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-tr from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
            <UserPlus2 className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight">Hisob Yaratish</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground/70">Barcha imkoniyatlardan foydalanishni boshlang.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-xl bg-amber-500/10 p-4 text-xs font-bold text-amber-600 dark:text-amber-400">
              Supabase ulanmagan. Ro'yxatdan o'tish uchun muhit o'zgaruvchilarini sozlang.
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">F.I.SH</Label>
                <Input
                  id="fullName"
                  placeholder="Ali Valiyev"
                  className="h-14 rounded-2xl bg-white/50 dark:bg-black/20"
                  {...form.register('fullName')}
                />
                {form.formState.errors.fullName && (
                  <p className="text-[10px] font-bold text-destructive ml-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Maktab</Label>
                <Input
                  id="schoolName"
                  placeholder="21-maktab"
                  className="h-14 rounded-2xl bg-white/50 dark:bg-black/20"
                  {...form.register('schoolName')}
                />
                {form.formState.errors.schoolName && (
                  <p className="text-[10px] font-bold text-destructive ml-1">{form.formState.errors.schoolName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.uz"
                className="h-14 rounded-2xl bg-white/50 dark:bg-black/20"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-[10px] font-bold text-destructive ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-14 rounded-2xl bg-white/50 dark:bg-black/20"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-[10px] font-bold text-destructive ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-14 w-full rounded-[20px] text-lg font-black shadow-lg shadow-primary/20"
              disabled={form.formState.isSubmitting || !isSupabaseConfigured}
              variant="gradient"
            >
              {form.formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Yaratilmoqda...
                </div>
              ) : (
                'Ro\'yxatdan o\'tish'
              )}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-muted-foreground/60">
              Hisobingiz bormi?{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Kirish
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
