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
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await register(values)

      if (result.emailConfirmationRequired) {
        toast.success('Account created. Confirm your email first.')
        navigate('/login')
        return
      }

      toast.success('Account created.')
      navigate(result.profile?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed.')
    }
  })

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Create account</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Register</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Set up your teacher workspace.</p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
            Supabase configuration is missing.
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" placeholder="Ali Valiyev" {...form.register('fullName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolName">School</Label>
            <Input id="schoolName" placeholder="21-maktab" {...form.register('schoolName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="teacher@school.uz" {...form.register('email')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Password" {...form.register('password')} />
          </div>

          <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting || !isSupabaseConfigured}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Register
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
