import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClassDetailPayload, ClassesPayload, AssignmentType, StudentCredentials, StudentRecord } from '@teacher-assistant/shared'
import { Award, CalendarDays, CheckCircle2, Clock3, Copy, Crown, Eye, KeyRound, Mic2, Plus, RefreshCw, Send, ShieldAlert, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardLoader } from '@/components/shared/loading-state'
import { apiRequest } from '@/lib/api'
import { getUzToastError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const assignmentTypes: Array<{ value: AssignmentType; label: string }> = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'variant_test', label: 'Variant test' },
  { value: 'open_question', label: 'Open question' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'mini_game', label: 'Mini game' },
]

const feedbackTemplates = [
  "Yaxshi harakat qilding. Fikring aniq, faqat ayrim joylarda grammatikani yana mustahkamlash kerak.",
  "Javobing yaxshi tuzilgan. Keyingi safar misollarni koproq ishlatsang, natija yanada kuchli boladi.",
  "Progress bor. Xatolarni tekshirib, shu mavzuni yana bir marta takrorlasang, keyingi ish ancha yaxshilanadi.",
]

export function ClassesPage() {
  const queryClient = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [className, setClassName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [studentName, setStudentName] = useState('')
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null)
  const [studentCredentials, setStudentCredentials] = useState<Record<string, StudentCredentials>>({})
  const [openCredentialStudentId, setOpenCredentialStudentId] = useState<string | null>(null)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('multiple_choice')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('18:00')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('30')
  const [pointsPerCorrect, setPointsPerCorrect] = useState('5')
  const [questionText, setQuestionText] = useState('')
  const [optionsText, setOptionsText] = useState('A) \nB) \nC) \nD) ')
  const [correctLetters, setCorrectLetters] = useState('A')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiTitle, setAiTitle] = useState('')
  const [aiAssignmentType, setAiAssignmentType] = useState<'multiple_choice' | 'speaking'>('multiple_choice')

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
          audioUrl?: string | null
          telegramFileId?: string | null
          speakingAnswers?: Array<{ questionId: string; questionText: string; audioUrl: string | null }>
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
      toast.success('Sinf yaratildi.')
      await queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
    onError: (error) => toast.error(getUzToastError(error, "Sinf yaratib bo'lmadi.")),
  })

  const addStudentMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ student: StudentRecord; credentials: StudentCredentials }>(`/classes/${activeClassId}/students`, {
        method: 'POST',
        body: JSON.stringify({ fullName: studentName }),
      }),
    onSuccess: async (data) => {
      setStudentName('')
      setCredentials(data.credentials)
      setStudentCredentials((current) => ({ ...current, [data.student.id]: data.credentials }))
      setOpenCredentialStudentId(data.student.id)
      toast.success("O'quvchi qo'shildi.")
      await queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
    },
    onError: (error) => toast.error(getUzToastError(error, "O'quvchini qo'shib bo'lmadi.")),
  })

  const regeneratePasswordMutation = useMutation({
    mutationFn: (studentId: string) =>
      apiRequest<{ credentials: StudentCredentials }>(`/classes/students/${studentId}/regenerate-password`, {
        method: 'POST',
      }),
    onSuccess: (data, studentId) => {
      setCredentials(data.credentials)
      setStudentCredentials((current) => ({ ...current, [studentId]: data.credentials }))
      setOpenCredentialStudentId(studentId)
      toast.success('Parol yangilandi.')
      void queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
    },
    onError: (error) => toast.error(getUzToastError(error, "Parolni yangilab bo'lmadi.")),
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
      toast.success("Topshiriq yuborildi.")
      await queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
    },
    onError: (error) => toast.error(getUzToastError(error, "Topshiriqni yuborib bo'lmadi.")),
  })

  const createAiAssignmentMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ generated: { title: string; questionCount: number; type: 'multiple_choice' | 'speaking' } }>('/classes/assignments/ai', {
        method: 'POST',
        body: JSON.stringify({
          classId: activeClassId,
          prompt: aiPrompt,
          type: aiAssignmentType,
          title: aiTitle || null,
          pointsPerCorrect: Number(pointsPerCorrect),
          deadlineAt: getDeadlineIso(deadlineDate, deadlineTime),
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
          maxAttempts: 2,
          randomizeQuestions: true,
          randomizeOptions: true,
        }),
      }),
    onSuccess: async (data) => {
      setAiPrompt('')
      setAiTitle('')
      toast.success(
        data.generated.type === 'speaking'
          ? `${data.generated.questionCount} ta speaking prompt yuborildi.`
          : `${data.generated.questionCount} ta savolli test yuborildi.`,
      )
      await queryClient.invalidateQueries({ queryKey: ['class-detail', activeClassId] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => toast.error(getUzToastError(error, "AI orqali topshiriq yaratib bo'lmadi.")),
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
      deadlineAt: getDeadlineIso(deadlineDate, deadlineTime),
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
                activeClassId === item.id ? 'border-primary/40 bg-primary/[0.08] text-foreground ring-2 ring-primary/15' : 'border-border bg-card hover:bg-secondary',
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
                          <div className="mt-1 text-xs text-muted-foreground">Login: {student.login}</div>
                        </div>
                        <Badge variant={student.status === 'active' ? 'default' : 'outline'}>{student.status}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <span>{student.totalMonthlyScore} score</span>
                        <span>{student.completedAssignments} done</span>
                        <span>{student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleDateString() : 'No activity'}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            setOpenCredentialStudentId((current) => (current === student.id ? null : student.id))
                          }
                        >
                          <Eye className="h-4 w-4" />
                          Parollar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => regeneratePasswordMutation.mutate(student.id)}
                          disabled={regeneratePasswordMutation.isPending}
                        >
                          <KeyRound className="h-4 w-4" />
                          Parolni yangilash
                        </Button>
                      </div>
                      {openCredentialStudentId === student.id ? (
                        <StudentCredentialsPanel
                          className="mt-3"
                          credentials={studentCredentials[student.id] ?? null}
                          fallbackLogin={student.login}
                          fallbackPassword={student.password}
                        />
                      ) : null}
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
                      <StudentCredentialsPanel
                        className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-black"
                        credentials={credentials}
                        variant="success"
                      />
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <SectionTitle icon={Sparkles} title="AI assignment" hint="Test yoki speaking topshirigini AI orqali yarating" />
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  <Label>Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(event) => {
                      const nextPrompt = event.target.value
                      setAiPrompt(nextPrompt)
                      const inferredType = inferAiAssignmentType(nextPrompt)
                      if (inferredType) {
                        setAiAssignmentType(inferredType)
                      }
                    }}
                    placeholder={
                      aiAssignmentType === 'speaking'
                        ? 'Masalan: 6-sinf uchun Present Simple mavzusida 5 ta speaking prompt yarating.'
                        : 'Masalan: 6-sinf ingliz tili Present Simple mavzusidan 10 ta test, oson va orta darajada.'
                    }
                    className="min-h-32"
                  />
                  <Input value={aiTitle} onChange={(event) => setAiTitle(event.target.value)} placeholder="Title optional" />
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Topshiriq turi</div>
                    <select
                      className="h-12 w-full rounded-2xl border border-input bg-card/80 px-4 text-sm font-semibold shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      value={aiAssignmentType}
                      onChange={(event) => setAiAssignmentType(event.target.value as 'multiple_choice' | 'speaking')}
                    >
                      <option value="multiple_choice">Test</option>
                      <option value="speaking">Speaking audio</option>
                    </select>
                  </label>
                  <AssignmentSettings
                    deadlineDate={deadlineDate}
                    deadlineTime={deadlineTime}
                    timeLimitMinutes={timeLimitMinutes}
                    pointsPerCorrect={pointsPerCorrect}
                    onDeadlineDateChange={setDeadlineDate}
                    onDeadlineTimeChange={setDeadlineTime}
                    onTimeLimitChange={setTimeLimitMinutes}
                    onPointsChange={setPointsPerCorrect}
                  />
                  <Button className="w-full" disabled={!aiPrompt || createAiAssignmentMutation.isPending || !activeClassId} onClick={() => createAiAssignmentMutation.mutate()}>
                    <Sparkles className="h-4 w-4" />
                    {aiAssignmentType === 'speaking' ? 'Generate and send speaking' : 'Generate and send test'}
                  </Button>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {aiAssignmentType === 'speaking'
                      ? 'Speaking tanlansa oquvchi variant belgilamaydi, audio yozib topshiradi.'
                      : 'Test tanlansa AI variantli savollar yaratadi va har bir togri javob uchun ball qollanadi.'}
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
                  <AssignmentSettings
                    deadlineDate={deadlineDate}
                    deadlineTime={deadlineTime}
                    timeLimitMinutes={timeLimitMinutes}
                    pointsPerCorrect={pointsPerCorrect}
                    onDeadlineDateChange={setDeadlineDate}
                    onDeadlineTimeChange={setDeadlineTime}
                    onTimeLimitChange={setTimeLimitMinutes}
                    onPointsChange={setPointsPerCorrect}
                  />
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
              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground">
                Shu yerdan oquvchiga feedback yoziladi. Tekshirilgan ishga ball va izoh yuborilgandan keyin u student dashboardidagi
                <span className="font-bold text-foreground"> Teacher feedback </span>
                bolimida korinadi.
              </div>
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

function StudentCredentialsPanel({
  credentials,
  fallbackLogin,
  fallbackPassword,
  className,
  variant = 'default',
}: {
  credentials: StudentCredentials | null
  fallbackLogin?: string
  fallbackPassword?: string | null
  className?: string
  variant?: 'default' | 'success'
}) {
  const panelClassName =
    variant === 'success'
      ? className ?? ''
      : cn('rounded-xl border border-border bg-secondary/40 p-4 text-sm', className)

  const login = credentials?.login ?? fallbackLogin ?? '-'
  const password = credentials?.password ?? fallbackPassword ?? '-'

  return (
    <div className={panelClassName}>
      <div>Login: {login}</div>
      <div className="mt-1">Parol: {password}</div>
      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={async () => {
          await navigator.clipboard.writeText(`${login} / ${password}`)
          toast.success("Login va parol nusxalandi.")
        }}
      >
        <Copy className="h-4 w-4" />
        Nusxalash
      </Button>
    </div>
  )
}

function AssignmentSettings({
  deadlineDate,
  deadlineTime,
  timeLimitMinutes,
  pointsPerCorrect,
  onDeadlineDateChange,
  onDeadlineTimeChange,
  onTimeLimitChange,
  onPointsChange,
}: {
  deadlineDate: string
  deadlineTime: string
  timeLimitMinutes: string
  pointsPerCorrect: string
  onDeadlineDateChange: (value: string) => void
  onDeadlineTimeChange: (value: string) => void
  onTimeLimitChange: (value: string) => void
  onPointsChange: (value: string) => void
}) {
  const deadlinePreview = formatDeadlinePreview(deadlineDate, deadlineTime)

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black">Topshiriq sozlamalari</div>
          <div className="mt-1 text-xs text-muted-foreground">{deadlinePreview}</div>
        </div>
        {deadlineDate ? (
          <Button size="sm" variant="ghost" onClick={() => onDeadlineDateChange('')}>
            Clear
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setDeadlinePreset(0, '18:00', onDeadlineDateChange, onDeadlineTimeChange)}>
          Bugun 18:00
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDeadlinePreset(1, '09:00', onDeadlineDateChange, onDeadlineTimeChange)}>
          Ertaga 09:00
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDeadlinePreset(7, '18:00', onDeadlineDateChange, onDeadlineTimeChange)}>
          1 hafta
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SettingField icon={CalendarDays} label="Deadline sana">
          <Input
            type="date"
            min={toDateInputValue(new Date())}
            value={deadlineDate}
            onChange={(event) => onDeadlineDateChange(event.target.value)}
            className="h-11 bg-background"
          />
        </SettingField>
        <SettingField icon={Clock3} label="Deadline vaqt">
          <Input
            type="time"
            value={deadlineTime}
            onChange={(event) => onDeadlineTimeChange(event.target.value)}
            className="h-11 bg-background"
          />
        </SettingField>
        <SettingField icon={Clock3} label="Test vaqti">
          <div className="flex h-11 items-center rounded-xl border border-input bg-background px-3">
            <Input
              value={timeLimitMinutes}
              onChange={(event) => onTimeLimitChange(event.target.value)}
              inputMode="numeric"
              className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
            <span className="shrink-0 text-sm text-muted-foreground">min</span>
          </div>
        </SettingField>
        <SettingField icon={Award} label="Har togri javob">
          <div className="flex h-11 items-center rounded-xl border border-input bg-background px-3">
            <Input
              value={pointsPerCorrect}
              onChange={(event) => onPointsChange(event.target.value)}
              inputMode="decimal"
              className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
            <span className="shrink-0 text-sm text-muted-foreground">ball</span>
          </div>
        </SettingField>
      </div>
    </div>
  )
}

function SettingField({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {children}
    </label>
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
    audioUrl?: string | null
    telegramFileId?: string | null
    speakingAnswers?: Array<{ questionId: string; questionText: string; audioUrl: string | null }>
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
      toast.success("Ish tekshirildi.")
      await queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
    },
    onError: (error) => toast.error(getUzToastError(error, "Ishni tekshirib bo'lmadi.")),
  })

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black">{submission.studentName}</div>
          <div className="text-sm text-muted-foreground">
            {submission.assignmentTitle} - {submission.assignmentType}
          </div>
        </div>
        <Badge variant="outline">{new Date(submission.submittedAt).toLocaleDateString()}</Badge>
      </div>
      {submission.assignmentType === 'speaking' ? (
        <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-black">
            <Mic2 className="h-4 w-4" />
            Student audio javobi
          </div>
          {submission.speakingAnswers?.length ? (
            <div className="space-y-3">
              {submission.speakingAnswers.map((answer, index) => (
                <div key={answer.questionId} className="rounded-2xl border border-border bg-card/80 p-3">
                  <div className="mb-2 text-sm font-black">
                    {index + 1}. {answer.questionText}
                  </div>
                  {answer.audioUrl ? <audio className="w-full" src={answer.audioUrl} controls /> : null}
                </div>
              ))}
            </div>
          ) : submission.audioUrl ? (
            <audio className="w-full" src={submission.audioUrl} controls />
          ) : (
            <div className="text-sm text-muted-foreground">
              Audio web playerda topilmadi. {submission.telegramFileId ? 'Bu javob Telegram voice orqali yuborilgan.' : 'Student audio yubormagan.'}
            </div>
          )}
        </div>
      ) : null}
      <div className="mt-4 grid gap-4">
        <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
          <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Ball</div>
            <Input value={score} onChange={(event) => setScore(event.target.value)} inputMode="decimal" />
          </label>
          <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Oquvchiga feedback</div>
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Masalan: Yaxshi ish! Fikring aniq. Keyingi safar grammar va misollarga ko'proq e'tibor ber."
              className="min-h-[120px]"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {feedbackTemplates.map((template) => (
            <Button key={template} type="button" variant="outline" size="sm" onClick={() => setFeedback(template)}>
              Namuna
            </Button>
          ))}
        </div>

        <Button className="w-full sm:w-fit" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <RefreshCw className="h-4 w-4" />
          Feedback yuborish
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

function getDeadlineIso(deadlineDate: string, deadlineTime: string) {
  if (!deadlineDate) {
    return null
  }

  const dateTime = new Date(`${deadlineDate}T${deadlineTime || '23:59'}`)
  return Number.isNaN(dateTime.getTime()) ? null : dateTime.toISOString()
}

function setDeadlinePreset(
  dayOffset: number,
  time: string,
  onDeadlineDateChange: (value: string) => void,
  onDeadlineTimeChange: (value: string) => void,
) {
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + dayOffset)
  onDeadlineDateChange(toDateInputValue(nextDate))
  onDeadlineTimeChange(time)
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDeadlinePreview(deadlineDate: string, deadlineTime: string) {
  if (!deadlineDate) {
    return 'Deadline belgilanmagan'
  }

  const value = new Date(`${deadlineDate}T${deadlineTime || '23:59'}`)
  if (Number.isNaN(value.getTime())) {
    return 'Deadline sanasi notogri'
  }

  return `Deadline: ${new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)}`
}

function inferAiAssignmentType(prompt: string): 'multiple_choice' | 'speaking' | null {
  const normalized = prompt.toLowerCase()

  if (/\b(speaking|speak|oral|ogzaki|og'izaki|gapirish)\b/.test(normalized)) {
    return 'speaking'
  }

  if (/\b(test|quiz|variant|multiple choice)\b/.test(normalized)) {
    return 'multiple_choice'
  }

  return null
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
