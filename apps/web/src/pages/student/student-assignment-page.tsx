import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AssignmentQuestionRecord, StudentAssignmentRecord } from '@teacher-assistant/shared'
import { CheckCircle2, Clock3, Send, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BackButton } from '@/components/shared/back-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CardLoader } from '@/components/shared/loading-state'
import { apiRequest } from '@/lib/api'

export function StudentAssignmentPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [writingText, setWritingText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  const query = useQuery({
    queryKey: ['student-assignment', id],
    queryFn: () =>
      apiRequest<{
        assignment: StudentAssignmentRecord
        questions: AssignmentQuestionRecord[]
      }>(`/student/assignments/${id}`),
    enabled: Boolean(id),
  })

  const startMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ attempt: { attemptId: string; startedAt: string } }>(`/student/assignments/${id}/start`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setAttemptId(data.attempt.attemptId)
      toast.success('Attempt started.')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to start attempt.'),
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ status: string; scoreAwarded: number; maxScore: number }>(`/student/assignments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          attemptId,
          answers,
          writingText: writingText || null,
          audioUrl: audioUrl || null,
        }),
      }),
    onSuccess: (result) => {
      toast.success(result.status === 'graded' ? `Score: ${result.scoreAwarded}/${result.maxScore}` : 'Submitted for teacher review.')
      navigate('/student/dashboard')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to submit assignment.'),
  })

  const data = query.data
  const canAnswer = Boolean(attemptId) || data?.assignment.type === 'writing' || data?.assignment.type === 'speaking'
  const timeLabel = useMemo(() => {
    if (!data?.assignment.timeLimitMinutes) {
      return 'No time limit'
    }
    return `${data.assignment.timeLimitMinutes} min`
  }, [data])

  if (!data) {
    return <Shell><CardLoader /></Shell>
  }

  return (
    <Shell>
      <div className="space-y-5 animate-in">
        <BackButton />

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">{data.assignment.type}</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight">{data.assignment.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.assignment.deadlineAt ? `Deadline: ${new Date(data.assignment.deadlineAt).toLocaleString()}` : 'No deadline'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-[repeat(3,minmax(0,1fr))]">
              <Info icon={Clock3} label="Time" value={timeLabel} />
              <Info icon={Send} label="Attempts" value={data.assignment.attemptsRemaining} />
              <Info icon={CheckCircle2} label="Points" value={data.assignment.pointsPerCorrect} />
            </div>
            {!attemptId && ['multiple_choice', 'variant_test', 'mini_game', 'open_question'].includes(data.assignment.type) ? (
              <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending || data.assignment.attemptsRemaining <= 0}>
                <Clock3 className="h-4 w-4" />
                Start attempt
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            {data.questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border border-border p-4">
                <div className="font-black">
                  {index + 1}. {question.questionText}
                </div>
                {question.options.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {question.options.map((option) => {
                      const selected = answers[question.id]?.includes(option.id) ?? false
                      return (
                        <label key={option.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                          <input
                            type="checkbox"
                            disabled={!canAnswer}
                            checked={selected}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: event.target.checked
                                  ? [...(current[question.id] ?? []), option.id]
                                  : (current[question.id] ?? []).filter((idValue) => idValue !== option.id),
                              }))
                            }
                          />
                          <span className="text-sm">{option.optionText}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <Textarea
                    className="mt-4"
                    disabled={!canAnswer}
                    placeholder="Write your answer..."
                    onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: [event.target.value] }))}
                  />
                )}
              </div>
            ))}

            {data.assignment.type === 'writing' ? (
              <Textarea value={writingText} onChange={(event) => setWritingText(event.target.value)} placeholder="Write your text here..." />
            ) : null}

            {data.assignment.type === 'speaking' ? (
              <Textarea value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} placeholder="Paste audio URL, or send voice in Telegram." />
            ) : null}

            <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || (!canAnswer && !attemptId)}>
              <Send className="h-4 w-4" />
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-screen w-full max-w-md bg-background px-4 py-5 lg:max-w-3xl">{children}</div>
}

function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-secondary p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-black">{value}</div>
    </div>
  )
}
