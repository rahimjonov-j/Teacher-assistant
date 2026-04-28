import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClassDetailPayload, ClassesPayload, AssignmentType } from '@teacher-assistant/shared'
import { CheckCircle2, Copy, Crown, KeyRound, Plus, RefreshCw, Send, ShieldAlert, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardLoader } from '@/components/shared/loading-state'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'

const assignmentTypes: Array<{ value: AssignmentType; label: string }> = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'variant_test', label: 'Variant test' },
  { value: 'open_question', label: 'Open question' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'mini_game', label: 'Mini game' },
]

export function ClassesPage() {
  const queryClient = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [className, setClassName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [studentName, setStudentName] = useState('')
  const [credentials, setCredentials] = useState<{ login: string; password: string } | null>(null)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('multiple_choice')
  const [deadlineAt, setDeadlineAt] = useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('30')
  const [pointsPerCorrect, setPointsPerCorrect] = useState('5')
  const [questionText, setQuestionText] = useState('')
  const [optionsText, setOptionsText] = useState('A) \nB) \nC) \nD) ')
  const [correctLetters, setCorrectLetters] = useState('A')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiTitle, setAiTitle] = useState('')

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiRequest<ClassesPayload>('/classes'),
  })

  const classes = useMemo(() => classesQuery.data?.classes ?? [], [classesQuery.data?.classes])
  const activeClassId = selectedClassId ?? classes[0]?.id ?? null

  const detailQuery = useQuery({
    queryKey: ['class-detail', activeClassId],
    queryFn: () => apiRequest<ClassDetailPayload>(`/classes/${activeClassId}`),
    enabled: Boolean(activeClassId),
  })

  const pendingQuery = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () =>
      apiRequest<{
        submissions: Array<{
          id: string
          assignmentTitle: string
          assignmentType: AssignmentType
          studentName: string
          submittedAt: string
          maxScore: number
        }>
      }>('/classes/submissions/pending'),
  })

  const createClassMutation = useMutation({
    mutationFn: () =>
      apiRequest('/classes', {
        method: 'POST',
        body: JSON.stringify({ name: className, groupName, gradeLevel: gradeLevel || null }),
      }),
    onSuccess: async () => {
      setClassName('')
      setGroupName('')
      setGradeLevel('')
      toast.success('Class created.')
      await queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to create class.'),
  })

  const addStudentMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ credentials: { login: string; password: string } }>(`/classes/${activeClassId}/students`, {
        method: 'POST',
        body: JSON.stringify({ fullName: studentName }),
      }),
    onSuccess: async (data) => {
      setStudentName('')
      setCredentials(data.credentials)
      toast.success('Student added.')
      await queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to add student.'),
  })

  const createAssignmentMutation = useMutation({
    mutationFn: () =>
      apiRequest('/classes/assignments', {
        method: 'POST',
        body: JSON.stringify(buildAssignmentPayload()),
      }),
    onSuccess: async () => {
      setAssignmentTitle('')
      setQuestionText('')
      toast.success('Assignment sent.')
      await queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to send assignment.'),
  })

  const createAiAssignmentMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ generated: { title: string; questionCount: number } }>('/classes/assignments/ai', {
        method: 'POST',
        body: JSON.stringify({
          classId: activeClassId,
          prompt: aiPrompt,
          title: aiTitle || null,
          pointsPerCorrect: Number(pointsPerCorrect),
          deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : null,
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
          maxAttempts: 2,
          randomizeQuestions: true,
          randomizeOptions: true,
        }),
      }),
    onSuccess: async (data) => {
      setAiPrompt('')
      setAiTitle('')
      toast.success(`${data.generated.questionCount} question test sent.`)
      await queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to generate assignment.'),
  })

  const detail = detailQuery.data
  const limits = classesQuery.data?.limits

  const topStudent = detail?.leaderboard[0]
  const completionAverage = useMemo(() => {
    if (!detail?.assignments.length) {
      return 0
    }

    const total = detail.assignments.reduce((sum, assignment) => sum + assignment.recipientsCount, 0)
    const completed = detail.assignments.reduce((sum, assignment) => sum + assignment.gradedCount + assignment.submittedCount, 0)
    return total === 0 ? 0 : Math.round((completed / total) * 100)
  }, [detail])

  if (classesQuery.isLoading) {
    return <CardLoader />
  }

  function buildAssignmentPayload() {
    const options = parseOptions(optionsText, correctLetters)
    const hasQuestion = questionText.trim().length > 0
    return {
      classId: activeClassId,
      title: assignmentTitle,
      type: assignmentType,
      pointsPerCorrect: Number(pointsPerCorrect),
      deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
      maxAttempts: 2,
      randomizeQuestions: assignmentType === 'variant_test',
      randomizeOptions: assignmentType === 'multiple_choice' || assignmentType === 'variant_test',
      questions: hasQuestion
        ? [
            {
              questionText,
              options: ['multiple_choice', 'variant_test', 'mini_game'].includes(assignmentType) ? options : [],
            },
          ]
        : [],
      gameConfig: assignmentType === 'mini_game' ? { gameType: 'quick_quiz' } : {},
    }
  }

  return (
    <div className="grid gap-5 animate-in xl:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black tracking-tight">Classes / Sinf</div>
                <p className="text-sm text-muted-foreground">
                  {limits?.max === null ? 'Unlimited classes' : `${limits?.current ?? 0}/${limits?.max ?? 1} classes`}
                </p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>

            {limits && !limits.canCreate ? (
              <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-black">
                <div className="font-black">Upgrade needed</div>
                <p className="mt-1">Your current plan class limit is reached.</p>
              </div>
            ) : null}

            <div className="space-y-3">
              <Input placeholder="Class name, e.g. English 6" value={className} onChange={(event) => setClassName(event.target.value)} />
              <Input placeholder="Group, e.g. 6-A" value={groupName} onChange={(event) => setGroupName(event.target.value)} />
              <Input placeholder="Grade level" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} />
              <Button className="w-full" onClick={() => createClassMutation.mutate()} disabled={createClassMutation.isPending || !className || !groupName}>
                <Plus className="h-4 w-4" />
                Create class
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {classes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedClassId(item.id)}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-colors',
                activeClassId === item.id ? 'border-black bg-black text-white' : 'border-border bg-card hover:bg-secondary',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-black">{item.name}</div>
                <Badge variant={activeClassId === item.id ? 'default' : 'outline'}>{item.groupName}</Badge>
              </div>
              <div className="mt-2 text-sm opacity-80">{item.studentCount} students</div>
            </button>
          ))}
        </div>
      </div>

      {detail ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Students" value={detail.allStudents.length} />
            <Metric label="Top student" value={topStudent?.fullName ?? '-'} />
            <Metric label="Class score" value={detail.class.monthlyScore} />
            <Metric label="Completion" value={`${completionAverage}%`} />
          </div>

          <Card>
            <CardContent className="p-5">
              <SectionTitle icon={Crown} title="Rating" hint="Monthly leaderboard" />
              <div className="mt-4 grid gap-3">
                {detail.leaderboard.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-black', rankClass(student.rank))}>
                        {student.rank <= 3 ? <Crown className="h-5 w-5" /> : student.rank}
                      </div>
                      <div className="min-w-0">
                        <div className={cn('truncate font-black', nameClass(student.rank))}>{student.fullName}</div>
                        <div className="text-xs text-muted-foreground">{student.completedTasksCount} completed tasks</div>
                      </div>
                    </div>
                    <div className="font-black">{student.totalMonthlyScore}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <SectionTitle icon={Users} title="All students" hint="Status, score and activity" />
                <div className="mt-4 space-y-3">
                  {detail.allStudents.map((student) => (
                    <div key={student.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-black">{student.fullName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{student.login}</div>
                        </div>
                        <Badge variant={student.status === 'active' ? 'default' : 'outline'}>{student.status}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <span>{student.totalMonthlyScore} score</span>
                        <span>{student.completedAssignments} done</span>
                        <span>{student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleDateString() : 'No activity'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <SectionTitle icon={CheckCircle2} title="Active students" hint="Today, week and month" />
                <div className="mt-4 grid gap-3">
                  <ActiveBucket title="Today" count={detail.activeStudents.today.length} />
                  <ActiveBucket title="This week" count={detail.activeStudents.week.length} />
                  <ActiveBucket title="This month" count={detail.activeStudents.month.length} />
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <SectionTitle icon={KeyRound} title="Add student" hint="Teacher-only credential generation" />
                  <div className="mt-4 space-y-3">
                    <Input placeholder="Full name" value={studentName} onChange={(event) => setStudentName(event.target.value)} />
                    <Button className="w-full" disabled={!studentName || addStudentMutation.isPending} onClick={() => addStudentMutation.mutate()}>
                      <Plus className="h-4 w-4" />
                      Add student
                    </Button>
                    {credentials ? (
                      <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-black">
                        <div className="font-black">Credentials</div>
                        <div className="mt-2">Login: {credentials.login}</div>
                        <div>Password: {credentials.password}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={async () => {
                            await navigator.clipboard.writeText(`${credentials.login} / ${credentials.password}`)
                            toast.success('Credentials copied.')
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <SectionTitle icon={Sparkles} title="GPT test" hint="Prompt yozing, deadline va ball belgilang, test sinfga yuboriladi" />
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  <Label>Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="Masalan: 6-sinf ingliz tili Present Simple mavzusidan 10 ta test, oson va orta darajada."
                    className="min-h-32"
                  />
                  <Input value={aiTitle} onChange={(event) => setAiTitle(event.target.value)} placeholder="Test title optional" />
                </div>
                <div className="space-y-3">
                  <Label>Deadline, time limit, points</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input type="datetime-local" value={deadlineAt} onChange={(event) => setDeadlineAt(event.target.value)} />
                    <Input value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} placeholder="Minutes" />
                    <Input value={pointsPerCorrect} onChange={(event) => setPointsPerCorrect(event.target.value)} placeholder="Points" />
                  </div>
                  <Button className="w-full" disabled={!aiPrompt || createAiAssignmentMutation.isPending || !activeClassId} onClick={() => createAiAssignmentMutation.mutate()}>
                    <Sparkles className="h-4 w-4" />
                    Generate and send test
                  </Button>
                  <p className="text-xs leading-5 text-muted-foreground">
                    GPT testni yaratadi, har bir togri javob uchun belgilangan ballni qollaydi va oquvchilarga yuboradi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <SectionTitle icon={Send} title="Manual assignment" hint="Savol va variantlarni qolda kiriting" />
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="space-y-3">
                  <Label>Title</Label>
                  <Input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} placeholder="Unit 4 quiz" />
                  <Label>Type</Label>
                  <select className="h-11 rounded-xl border border-input bg-background px-3 text-sm" value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as AssignmentType)}>
                    {assignmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-3">
                    <Input type="datetime-local" value={deadlineAt} onChange={(event) => setDeadlineAt(event.target.value)} />
                    <Input value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} placeholder="Minutes" />
                    <Input value={pointsPerCorrect} onChange={(event) => setPointsPerCorrect(event.target.value)} placeholder="Points" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Question or prompt</Label>
                  <Textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Write the task prompt..." />
                  {['multiple_choice', 'variant_test', 'mini_game'].includes(assignmentType) ? (
                    <>
                      <Label>Options</Label>
                      <Textarea value={optionsText} onChange={(event) => setOptionsText(event.target.value)} />
                      <Input value={correctLetters} onChange={(event) => setCorrectLetters(event.target.value.toUpperCase())} placeholder="Correct letters, e.g. A,C" />
                    </>
                  ) : null}
                  <Button className="w-full" disabled={!assignmentTitle || createAssignmentMutation.isPending} onClick={() => createAssignmentMutation.mutate()}>
                    <Send className="h-4 w-4" />
                    Send assignment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <SectionTitle icon={ShieldAlert} title="Pending manual review" hint="Writing, speaking and open answers" />
              <div className="mt-4 space-y-3">
                {(pendingQuery.data?.submissions ?? []).slice(0, 6).map((submission) => (
                  <ReviewRow key={submission.id} submission={submission} />
                ))}
                {(pendingQuery.data?.submissions ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No pending submissions.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-black">Create your first class</h2>
            <p className="mt-2 text-sm text-muted-foreground">Classes, students, ratings and assignments will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
        <div className="mt-2 truncate text-xl font-black">{value}</div>
      </CardContent>
    </Card>
  )
}

function SectionTitle({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-black">{title}</div>
        <div className="text-sm text-muted-foreground">{hint}</div>
      </div>
    </div>
  )
}

function ActiveBucket({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <span className="font-semibold">{title}</span>
      <Badge>{count}</Badge>
    </div>
  )
}

function ReviewRow({
  submission,
}: {
  submission: {
    id: string
    assignmentTitle: string
    assignmentType: AssignmentType
    studentName: string
    submittedAt: string
    maxScore: number
  }
}) {
  const queryClient = useQueryClient()
  const [score, setScore] = useState(String(submission.maxScore || 10))
  const [feedback, setFeedback] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(`/classes/submissions/${submission.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ scoreAwarded: Number(score), feedback }),
      }),
    onSuccess: async () => {
      toast.success('Submission reviewed.')
      await queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to review submission.'),
  })

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black">{submission.studentName}</div>
          <div className="text-sm text-muted-foreground">
            {submission.assignmentTitle} · {submission.assignmentType}
          </div>
        </div>
        <Badge variant="outline">{new Date(submission.submittedAt).toLocaleDateString()}</Badge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[90px_1fr_auto]">
        <Input value={score} onChange={(event) => setScore(event.target.value)} />
        <Input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback" />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <RefreshCw className="h-4 w-4" />
          Grade
        </Button>
      </div>
    </div>
  )
}

function parseOptions(optionsText: string, correctLetters: string) {
  const correct = new Set(correctLetters.split(',').map((letter) => letter.trim().toUpperCase()))
  return optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const letter = line.match(/^([A-Z])\)/i)?.[1]?.toUpperCase() ?? String.fromCharCode(65 + index)
      return {
        optionText: line.replace(/^[A-Z]\)\s*/i, ''),
        isCorrect: correct.has(letter),
      }
    })
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
