import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { StudentRecord } from '@teacher-assistant/shared'
import { GraduationCap, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BackButton } from '@/components/shared/back-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api'
import { setStudentToken } from '@/lib/student-auth'

export function StudentLoginPage() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      apiRequest<{ token: string; student: StudentRecord }>('/student/login', {
        method: 'POST',
        body: JSON.stringify({ login: login.trim(), password: password.trim() }),
      }),
    onSuccess: (data) => {
      setStudentToken(data.token)
      toast.success(`Welcome, ${data.student.fullName}.`)
      navigate('/student/dashboard', { replace: true })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Student login failed.'),
  })

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <BackButton className="mb-4" />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <Card className="w-full">
          <CardContent className="space-y-5 p-6">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-black tracking-tight">Student login</h1>
              <p className="mt-2 text-sm text-muted-foreground">Use the login and password your teacher generated.</p>
            </div>
            <div className="space-y-3">
              <Label>Login</Label>
              <Input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" />
              <Label>Password</Label>
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
            </div>
            <Button className="w-full" disabled={!login || !password || mutation.isPending} onClick={() => mutation.mutate()}>
              <LogIn className="h-4 w-4" />
              Open dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
