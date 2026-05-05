import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AssignmentQuestionRecord, StudentAssignmentRecord } from '@teacher-assistant/shared'
import { CheckCircle2, Clock3, Mic2, Send, Square, Trash2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CardLoader } from '@/components/shared/loading-state'
import { apiRequest } from '@/lib/api'
import { getUzToastError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function StudentAssignmentPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [writingText, setWritingText] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<number | null>(null)

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
      toast.success('Test boshlandi.')
    },
    onError: (error) => toast.error(getUzToastError(error, "Testni boshlab bo'lmadi.")),
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      let uploadedAudioUrl: string | null = null

      if (query.data?.assignment.type === 'speaking') {
        if (!audioBlob) {
          throw new Error('Avval audio yozib oling.')
        }

        const audioBase64 = await blobToDataUrl(audioBlob)
        const audio = await apiRequest<{ audioUrl: string; storagePath: string }>(`/student/assignments/${id}/audio`, {
          method: 'POST',
          body: JSON.stringify({
            audioBase64,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        })
        uploadedAudioUrl = audio.audioUrl
      }

      return apiRequest<{ status: string; scoreAwarded: number; maxScore: number }>(`/student/assignments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          attemptId,
          answers,
          writingText: writingText || null,
          audioUrl: uploadedAudioUrl,
        }),
      })
    },
    onSuccess: (result) => {
      toast.success(
        result.status === 'graded'
          ? `Ball: ${result.scoreAwarded}/${result.maxScore}`
          : "Topshiriq o'qituvchi tekshiruviga yuborildi.",
      )
      navigate('/student/dashboard')
    },
    onError: (error) => toast.error(getUzToastError(error, "Topshiriqni yuborib bo'lmadi.")),
  })

  const data = query.data
  const canAnswer = Boolean(attemptId) || data?.assignment.type === 'writing' || data?.assignment.type === 'speaking'
  const timeLabel = useMemo(() => {
    if (!data?.assignment.timeLimitMinutes) {
      return 'No time limit'
    }
    return `${data.assignment.timeLimitMinutes} min`
  }, [data])

  function stopRecordingTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopRecordingTimer()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
    }
  }, [audioPreviewUrl])

  if (!data) {
    return <Shell><CardLoader /></Shell>
  }

  const isSpeaking = data.assignment.type === 'speaking'

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Bu brauzer audio yozishni qollab-quvvatlamaydi.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedAudioMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      chunksRef.current = []
      streamRef.current = stream
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl)
          }
          return URL.createObjectURL(blob)
        })
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setIsRecording(false)
        stopRecordingTimer()
      }

      setAudioBlob(null)
      setAudioPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl)
        }
        return null
      })
      setRecordingSeconds(0)
      recorder.start()
      setIsRecording(true)
      timerRef.current = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000)
    } catch {
      toast.error('Mikrofonga ruxsat berilmadi.')
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  function removeRecording() {
    setAudioBlob(null)
    setAudioPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
      return null
    })
    setRecordingSeconds(0)
  }

  return (
    <Shell>
      <div className="space-y-5 animate-in">
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
              <Info icon={Clock3} label="Vaqt" value={timeLabel} />
              <Info icon={Send} label="Urinishlar" value={data.assignment.attemptsRemaining} />
              <Info icon={CheckCircle2} label="Ball" value={data.assignment.pointsPerCorrect} />
            </div>
            {!attemptId && ['multiple_choice', 'variant_test', 'mini_game', 'open_question'].includes(data.assignment.type) ? (
              <Button className="w-full rounded-2xl sm:w-fit" onClick={() => startMutation.mutate()} disabled={startMutation.isPending || data.assignment.attemptsRemaining <= 0}>
                <Clock3 className="h-4 w-4" />
                Testni boshlash
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            {data.questions.map((question, index) => {
              if (isSpeaking) {
                return (
                  <div key={question.id} className="overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-primary/5 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
                        <Mic2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">Speaking prompt {index + 1}</div>
                        <div className="mt-1 font-black leading-6">{question.questionText}</div>
                        <div className="mt-2 text-sm text-muted-foreground">Javobni variant tanlab emas, audio shaklida topshiring.</div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={question.id} className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black leading-6">{question.questionText}</div>
                      {question.options.length > 0 ? (
                        <div className="mt-1 text-xs font-semibold text-muted-foreground">Faqat bitta javobni tanlang</div>
                      ) : null}
                    </div>
                  </div>
                  {question.options.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const selected = answers[question.id]?.includes(option.id) ?? false
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!canAnswer}
                            onClick={() =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: [option.id],
                              }))
                            }
                            className={cn(
                              'group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200',
                              'bg-background/70 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5 hover:shadow-md',
                              'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none',
                              selected
                                ? 'border-primary bg-primary/10 shadow-md ring-4 ring-primary/10'
                                : 'border-border',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-black transition-colors',
                                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
                              )}
                            >
                              {selected ? <CheckCircle2 className="h-5 w-5" /> : getOptionLetter(optionIndex)}
                            </span>
                            <span className="flex-1 text-sm font-semibold leading-6 text-foreground">{option.optionText}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <Textarea
                      className="mt-4"
                      disabled={!canAnswer}
                      placeholder="Javobingizni yozing..."
                      onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: [event.target.value] }))}
                    />
                  )}
                </div>
              )
            })}

            {data.assignment.type === 'writing' ? (
              <Textarea value={writingText} onChange={(event) => setWritingText(event.target.value)} placeholder="Matningizni shu yerga yozing..." />
            ) : null}

            {data.assignment.type === 'speaking' ? (
              <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-black">Audio javob</div>
                    <div className="text-sm text-muted-foreground">Speaking topshirigi audio shaklida yuboriladi.</div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Button
                    type="button"
                    className={cn('h-14 rounded-2xl text-base', isRecording && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={submitMutation.isPending}
                  >
                    {isRecording ? <Square className="h-5 w-5" /> : <Mic2 className="h-5 w-5" />}
                    {isRecording ? `Yozishni tugatish ${formatRecordingTime(recordingSeconds)}` : 'Mic bosib audio yozish'}
                  </Button>

                  {audioPreviewUrl ? (
                    <div className="rounded-2xl border border-border bg-card/80 p-3">
                      <audio className="w-full" src={audioPreviewUrl} controls />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-muted-foreground">Audio tayyor. Xohlasangiz qayta yozishingiz mumkin.</div>
                        <Button type="button" variant="outline" size="sm" onClick={removeRecording} disabled={submitMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                          Ochirish
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-primary/20 bg-background/60 p-4 text-sm text-muted-foreground">
                      Student javobni shu yerda yozib oladi. Link kiritish shart emas.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <Button className="w-full rounded-2xl" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || (!canAnswer && !attemptId) || (isSpeaking && (!audioBlob || isRecording))}>
              <Send className="h-4 w-4" />
              Javobni yuborish
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

function getSupportedAudioMimeType() {
  const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg']
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ''
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function formatRecordingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getOptionLetter(index: number) {
  return String.fromCharCode(65 + index)
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
