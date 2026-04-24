import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const requestForm = useForm<RequestValues>({ resolver: zodResolver(requestSchema) })
  const updateForm = useForm<UpdateValues>({ resolver: zodResolver(updateSchema) })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && isRecoveryUrl()) {
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
      toast.success('Reset link sent.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reset request failed.')
    }
  })

  const onUpdatePassword = updateForm.handleSubmit(async (values) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })

      if (error) {
        throw new Error(error.message)
      }

      toast.success('Password updated.')
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password update failed.')
    }
  })

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Reset password</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Password</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {hasRecoverySession ? 'Set a new password for your account.' : 'Enter your email and we will send a reset link.'}
          </p>
        </div>

        {hasRecoverySession ? (
          <form onSubmit={onUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} className="pr-12" {...updateForm.register('password')} />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="pr-12" {...updateForm.register('confirmPassword')} />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full" disabled={updateForm.formState.isSubmitting || !isSupabaseConfigured}>
              {updateForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        ) : (
          <form onSubmit={onRequestReset} className="space-y-4">
            {resetEmailSent ? (
              <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                Check your email for the reset link.
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="teacher@school.uz" {...requestForm.register('email')} />
            </div>
            <Button type="submit" className="h-12 w-full" disabled={requestForm.formState.isSubmitting || !isSupabaseConfigured}>
              {requestForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send reset link
            </Button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
