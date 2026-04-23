import { useQuery } from '@tanstack/react-query'
import { UserCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { formatDate, formatRelativeDate, getPlanName } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TeachersResponse {
  teachers: Array<{
    id: string
    email: string
    fullName: string | null
    schoolName: string | null
    role: 'teacher' | 'admin'
    createdAt: string
    totalRequests: number
    creditsConsumed: number
    totalTokens: number
    lastActiveAt: string | null
    subscription: {
      planKey: 'free_trial' | 'basic' | 'pro' | 'premium'
      status: string
      creditsRemaining: number
      creditsUsed: number
    } | null
  }>
}

export function AdminTeachersPage() {
  const query = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => apiRequest<TeachersResponse>('/admin/teachers'),
  })

  return (
    <div className="space-y-10 animate-in">
      <PageHeader
        eyebrow="Users Database"
        title="O'qituvchilar"
      />

      <Card className="overflow-hidden border-border/70 bg-white/90 shadow-xl dark:border-white/5 dark:bg-[#0a0c10] dark:shadow-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/90 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:border-white/5 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-8 py-5">Foydalanuvchi</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Tarif</th>
                  <th className="px-8 py-5">So'rovlar</th>
                  <th className="px-8 py-5">Tokenlar</th>
                  <th className="px-8 py-5">Oxirgi faollik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                {query.data?.teachers.map((teacher) => (
                  <tr key={teacher.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <UserCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold leading-none text-slate-900 dark:text-white">{teacher.fullName || "Noma'lum"}</div>
                          <div className="mt-1.5 text-[11px] font-medium text-slate-500">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant={teacher.role === 'admin' ? 'gradient' : 'outline'} className={cn(
                        "h-6 px-3 border-none text-[10px]",
                        teacher.role === 'admin' ? "bg-sky-500 text-white" : "bg-white/5 text-slate-400"
                      )}>
                        {teacher.role === 'admin' ? 'Admin' : 'Teacher'}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      {teacher.subscription ? (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{getPlanName(teacher.subscription.planKey)}</div>
                          <div className="mt-1 text-[11px] font-medium text-slate-500">{teacher.subscription.creditsRemaining} credits left</div>
                        </div>
                      ) : (
                        <span className="text-slate-600">No Plan</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 dark:text-white">{teacher.totalRequests}</div>
                      <div className="mt-1 text-[11px] font-medium text-slate-500">{teacher.creditsConsumed} consumed</div>
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-600 dark:text-slate-400">
                      {teacher.totalTokens.toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {teacher.lastActiveAt ? formatRelativeDate(teacher.lastActiveAt) : "Hali yo'q"}
                      </div>
                      <div className="mt-1 text-[11px] font-medium text-slate-500">Joined: {formatDate(teacher.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
