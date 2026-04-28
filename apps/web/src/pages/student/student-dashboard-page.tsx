import { useQuery } from '@tanstack/react-query'
import type { StudentDashboardPayload } from '@teacher-assistant/shared'
import { ArrowRight, Crown, LogOut, Medal, MessageSquareText, Send, Trophy, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CardLoader } from '@/components/shared/loading-state'
import { apiRequest } from '@/lib/api'
import { clearStudentToken } from '@/lib/student-auth'
import { cn } from '@/lib/utils'

export function StudentDashboardPage() {
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => apiRequest<StudentDashboardPayload>('/student/dashboard'),
    retry: false,
  })

  if (query.isLoading) {
    return <StudentShell><CardLoader /></StudentShell>
  }

  if (!query.data) {
    return (
      <StudentShell>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Session expired.</p>
            <Button className="mt-4" onClick={() => navigate('/student-login', { replace: true })}>
              Login again
            </Button>
          </CardContent>
        </Card>
      </StudentShell>
    )
  }

  const data = query.data

  return (
    <StudentShell>
      <div className="space-y-5 animate-in">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">{data.student.className} / {data.student.groupName}</div>
                <h1 className="mt-2 text-2xl font-black tracking-tight">{data.student.fullName}</h1>
                <p className="mt-2 text-sm text-muted-foreground">Teacher: {data.student.teacherName ?? 'Teacher'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  clearStudentToken()
                  navigate('/student-login', { replace: true })
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Metric icon={Trophy} label="Rating" value={data.student.totalMonthlyScore} />
              <Metric icon={Medal} label="Rank" value={data.rank ?? '-'} />
              <Metric icon={Send} label="Active" value={data.activeAssignments.length} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-black">Active assignments</div>
                <div className="text-sm text-muted-foreground">Deadlines, attempts and scores</div>
              </div>
              <Badge variant={data.student.telegramConnected ? 'default' : 'outline'}>
                Telegram {data.student.telegramConnected ? 'connected' : 'not connected'}
              </Badge>
            </div>
            <div className="space-y-3">
              {data.activeAssignments.map((assignment) => (
                <Link key={assignment.id} to={`/student/assignments/${assignment.id}`} className="block rounded-xl border border-border p-4 transition-colors hover:bg-secondary">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-black">{assignment.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {assignment.type} · {assignment.attemptsRemaining} attempts left · {assignment.deadlineAt ? new Date(assignment.deadlineAt).toLocaleString() : 'No deadline'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              {data.activeAssignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No active assignments.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="font-black">Top 10 leaderboard</div>
            <div className="mt-4 space-y-3">
              {data.leaderboard.map((entry) => (
                <div key={entry.studentId} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-secondary font-black', rankClass(entry.rank))}>
                      {entry.rank <= 3 ? <Crown className="h-4 w-4" /> : entry.rank}
                    </div>
                    <div className={cn('font-black', nameClass(entry.rank))}>{entry.fullName}</div>
                  </div>
                  <div className="font-black">{entry.totalMonthlyScore}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <MessageSquareText className="h-5 w-5" />
              <div className="font-black">Teacher feedback</div>
            </div>
            <div className="space-y-3">
              {data.feedback.map((item) => (
                <div key={item.submissionId} className="rounded-xl border border-border p-4">
                  <div className="font-black">{item.assignmentTitle}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.feedback ?? 'Score added.'}</div>
                  <Badge className="mt-3">{item.scoreAwarded} points</Badge>
                </div>
              ))}
              {data.feedback.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No feedback yet.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentShell>
  )
}

function StudentShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-screen w-full max-w-md bg-background px-4 py-5 lg:max-w-4xl">{children}</div>
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  )
}

function rankClass(rank: number) {
  if (rank === 1) {
    return 'bg-yellow-100 text-yellow-700'
  }
  if (rank === 2) {
    return 'bg-blue-100 text-blue-700'
  }
  if (rank === 3) {
    return 'bg-green-100 text-green-700'
  }
  return ''
}

function nameClass(rank: number) {
  if (rank === 1) {
    return 'text-yellow-700'
  }
  if (rank === 2) {
    return 'text-blue-700'
  }
  if (rank === 3) {
    return 'text-green-700'
  }
  return ''
}
