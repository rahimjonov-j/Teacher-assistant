import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { StudentRecord } from '@teacher-assistant/shared'
import { GraduationCap, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api'
import { setStudentToken } from '@/lib/student-auth'
import { getUzToastError } from '@/lib/toast'

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
      toast.success(`Xush kelibsiz, ${data.student.fullName}.`)
      navigate('/student/dashboard', { replace: true })
    },
    onError: (error) => toast.error(getUzToastError(error, "Tizimga kirib bo'lmadi.")),
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] px-4 py-8 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[520px] w-[820px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse at center, rgba(198,248,51,0.14), transparent 62%)', filter: 'blur(8px)' }}
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#15151a] p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
          <div className="space-y-5">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c6f833] shadow-[0_0_24px_-4px_rgba(198,248,51,0.5)]">
                <GraduationCap className="h-6 w-6 text-[#0a0a0c]" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">O‘quvchi kirishi</h1>
              <p className="mt-2 text-sm text-white/55">O‘qituvchingiz bergan login va paroldan foydalaning.</p>
            </div>
            <div className="space-y-3">
              <Label className="text-white/80">Login</Label>
              <Input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" />
              <Label className="text-white/80">Parol</Label>
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#c6f833] focus-visible:ring-2 focus-visible:ring-[#c6f833]/20" />
            </div>
            <Button className="w-full bg-[#c6f833] text-[#0a0a0c] shadow-[0_14px_32px_-16px_rgba(198,248,51,0.6)] hover:bg-[#b4e81f]" disabled={!login || !password || mutation.isPending} onClick={() => mutation.mutate()}>
              <LogIn className="h-4 w-4" />
              Kirish
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
