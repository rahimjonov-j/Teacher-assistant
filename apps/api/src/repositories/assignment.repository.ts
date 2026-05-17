import type {
  AssignmentQuestionRecord,
  AssignmentRecord,
  AssignmentType,
  LeaderboardEntry,
  StudentAssignmentRecord,
  StudentDashboardPayload,
  StudentRecord,
  SubmissionStatus,
} from '@teacher-assistant/shared'
import { env } from '../config/env.js'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'
import { classRepository, classSchemaMigrationError, isClassSchemaMissing } from './class.repository.js'

const AUTO_GRADED_TYPES = new Set<AssignmentType>(['multiple_choice', 'variant_test', 'mini_game'])
const AUDIO_MIME_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
}

function currentMonthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

function toAssignmentRecord(row: any, recipientsCount = 0, submittedCount = 0, gradedCount = 0): AssignmentRecord {
  return {
    id: row.id as string,
    classId: (row.class_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    type: row.type as AssignmentType,
    status: row.status as AssignmentRecord['status'],
    pointsPerCorrect: Number(row.points_per_correct ?? 1),
    deadlineAt: (row.deadline_at as string | null) ?? null,
    timeLimitMinutes: row.time_limit_minutes === null ? null : Number(row.time_limit_minutes),
    maxAttempts: Number(row.max_attempts ?? 2),
    randomizeQuestions: Boolean(row.randomize_questions),
    randomizeOptions: Boolean(row.randomize_options),
    recipientsCount,
    submittedCount,
    gradedCount,
    createdAt: row.created_at as string,
  }
}

function toStudentRecord(row: any, monthlyScore = 0, completedTasksCount?: number): StudentRecord {
  return {
    id: row.id as string,
    classId: row.class_id as string,
    fullName: row.full_name as string,
    login: row.login as string,
    status: row.status as StudentRecord['status'],
    totalMonthlyScore: monthlyScore,
    allTimeScore: Number(row.all_time_score ?? 0),
    completedAssignments: completedTasksCount ?? Number(row.completed_assignments_count ?? 0),
    lastActiveAt: (row.last_active_at as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

async function countSubmissions(assignmentId: string, statuses: string[]) {
  const supabase = getSupabaseAdminClient()
  const { count, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .in('status', statuses)

  if (error) {
    throw new ApiError(500, 'Unable to count submissions.')
  }

  return count ?? 0
}

async function loadQuestions(assignmentId: string): Promise<AssignmentQuestionRecord[]> {
  const supabase = getSupabaseAdminClient()
  const { data: questionRows, error } = await supabase
    .from('assignment_questions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('position', { ascending: true })

  if (error) {
    throw new ApiError(500, 'Unable to load questions.')
  }

  const questions = questionRows ?? []
  const questionIds = questions.map((row: any) => row.id as string)
  const { data: optionRows, error: optionError } = questionIds.length
    ? await supabase
        .from('assignment_options')
        .select('*')
        .in('question_id', questionIds)
        .order('position', { ascending: true })
    : { data: [], error: null }

  if (optionError) {
    throw new ApiError(500, 'Unable to load options.')
  }

  const optionsByQuestion = new Map<string, any[]>()
  for (const option of optionRows ?? []) {
    const questionId = option.question_id as string
    optionsByQuestion.set(questionId, [...(optionsByQuestion.get(questionId) ?? []), option])
  }

  return questions.map((row: any) => ({
    id: row.id as string,
    assignmentId: row.assignment_id as string,
    questionText: row.question_text as string,
    variantKey: (row.variant_key as string | null) ?? null,
    position: Number(row.position ?? 0),
    points: row.points === null ? null : Number(row.points),
    options: (optionsByQuestion.get(row.id as string) ?? []).map((option: any) => ({
      id: option.id as string,
      questionId: option.question_id as string,
      optionText: option.option_text as string,
      isCorrect: Boolean(option.is_correct),
      position: Number(option.position ?? 0),
    })),
  }))
}

async function ensureTeacherOwnsAssignment(teacherId: string, assignmentId: string) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (error) {
    throw new ApiError(500, 'Unable to load assignment.')
  }

  if (!data) {
    throw new ApiError(404, 'Assignment not found.')
  }

  return data
}

async function awardScore(input: {
  studentId: string
  assignmentId: string
  submissionId: string
  score: number
  source: 'auto' | 'teacher' | 'game'
  note?: string | null
  previousScore?: number
}) {
  const supabase = getSupabaseAdminClient()
  const delta = input.score - (input.previousScore ?? 0)

  if (delta < 0 && Math.abs(delta) > 0) {
    const { error } = await supabase
      .from('scores')
      .insert({
        student_id: input.studentId,
        assignment_id: input.assignmentId,
        submission_id: input.submissionId,
        score: 0,
        source: input.source,
        note: input.note ?? 'Score was reduced during review.',
      })

    if (error) {
      throw new ApiError(500, 'Unable to save score adjustment.')
    }
  } else if (delta > 0) {
    const { error } = await supabase.from('scores').insert({
      student_id: input.studentId,
      assignment_id: input.assignmentId,
      submission_id: input.submissionId,
      score: delta,
      source: input.source,
      note: input.note ?? null,
    })

    if (error) {
      throw new ApiError(500, 'Unable to save score.')
    }
  }

  await updateRating(input.studentId, input.assignmentId, delta, input.previousScore === undefined)
}

async function updateRating(studentId: string, assignmentId: string, deltaScore: number, incrementCompleted: boolean) {
  const supabase = getSupabaseAdminClient()
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('class_id, all_time_score, completed_assignments_count')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    throw new ApiError(500, 'Unable to update student score.')
  }

  await supabase
    .from('students')
    .update({
      all_time_score: Math.max(0, Number(student.all_time_score ?? 0) + deltaScore),
      completed_assignments_count: Number(student.completed_assignments_count ?? 0) + (incrementCompleted ? 1 : 0),
      last_active_at: new Date().toISOString(),
    })
    .eq('id', studentId)

  const periodMonth = currentMonthStart()
  const { data: rating } = await supabase
    .from('monthly_ratings')
    .select('*')
    .eq('student_id', studentId)
    .eq('period_month', periodMonth)
    .maybeSingle()

  if (rating) {
    await supabase
      .from('monthly_ratings')
      .update({
        class_id: student.class_id,
        total_score: Math.max(0, Number(rating.total_score ?? 0) + deltaScore),
        completed_tasks_count: Number(rating.completed_tasks_count ?? 0) + (incrementCompleted ? 1 : 0),
      })
      .eq('id', rating.id)
  } else {
    await supabase.from('monthly_ratings').insert({
      class_id: student.class_id,
      student_id: studentId,
      period_month: periodMonth,
      total_score: Math.max(0, deltaScore),
      completed_tasks_count: incrementCompleted ? 1 : 0,
    })
  }

  await supabase.from('rating_history').upsert(
    {
      class_id: student.class_id,
      student_id: studentId,
      period_month: periodMonth,
      total_score: Math.max(0, (rating ? Number(rating.total_score ?? 0) : 0) + deltaScore),
      completed_tasks_count: (rating ? Number(rating.completed_tasks_count ?? 0) : 0) + (incrementCompleted ? 1 : 0),
    },
    { onConflict: 'student_id,period_month' },
  )

  void assignmentId
}

function selectedAnswersEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.every((value, index) => value === sortedRight[index])
}

function toSpeakingAnswers(
  answers: Record<string, string[] | string> | null,
  questions: Array<{ id: string; questionText: string }>,
) {
  if (!answers) {
    return []
  }

  return questions
    .map((question) => {
      const value = answers[question.id]
      const urls = Array.isArray(value) ? value : value ? [value] : []
      return {
        questionId: question.id,
        questionText: question.questionText,
        audioUrl: urls.find((url) => /^https?:\/\//i.test(url)) ?? null,
      }
    })
    .filter((item) => item.audioUrl)
}

export const assignmentRepository = {
  async createAssignment(
    teacherId: string,
    input: {
      classId?: string | null
      recipientStudentIds?: string[]
      title: string
      description?: string | null
      type: AssignmentType
      pointsPerCorrect: number
      deadlineAt?: string | null
      timeLimitMinutes?: number | null
      maxAttempts?: number
      randomizeQuestions?: boolean
      randomizeOptions?: boolean
      questions?: Array<{
        questionText: string
        variantKey?: string | null
        points?: number | null
        options?: Array<{ optionText: string; isCorrect: boolean }>
      }>
      gameConfig?: Record<string, unknown>
    },
  ) {
    if (!input.classId && (!input.recipientStudentIds || input.recipientStudentIds.length === 0)) {
      throw new ApiError(400, 'Select a class or at least one student.')
    }

    const supabase = getSupabaseAdminClient()
    let classId = input.classId ?? null
    let recipients: string[] = []

    if (classId) {
      await classRepository.getClassDetail(teacherId, classId)
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('class_id', classId)
        .eq('status', 'active')

      if (error) {
        throw new ApiError(500, 'Unable to load class students.')
      }

      recipients = (data ?? []).map((row: any) => row.id as string)
    } else {
      const { data, error } = await supabase
        .from('students')
        .select('id, class_id')
        .eq('teacher_id', teacherId)
        .in('id', input.recipientStudentIds ?? [])

      if (error) {
        throw new ApiError(500, 'Unable to load selected students.')
      }

      recipients = (data ?? []).map((row: any) => row.id as string)
      classId = recipients.length === 1 ? ((data?.[0] as any)?.class_id as string | null) : null
    }

    if (recipients.length === 0) {
      throw new ApiError(400, 'No active students found for this assignment.')
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        status: 'sent',
        points_per_correct: input.pointsPerCorrect,
        deadline_at: input.deadlineAt ?? null,
        time_limit_minutes: input.timeLimitMinutes ?? null,
        max_attempts: input.maxAttempts ?? 2,
        randomize_questions: input.randomizeQuestions ?? false,
        randomize_options: input.randomizeOptions ?? false,
        game_config: input.gameConfig ?? {},
      })
      .select('*')
      .single()

    if (error || !assignment) {
      throw new ApiError(400, error?.message ?? 'Unable to create assignment.')
    }

    for (const [questionIndex, question] of (input.questions ?? []).entries()) {
      const { data: questionRow, error: questionError } = await supabase
        .from('assignment_questions')
        .insert({
          assignment_id: assignment.id,
          question_text: question.questionText,
          variant_key: question.variantKey ?? null,
          position: questionIndex,
          points: question.points ?? null,
        })
        .select('*')
        .single()

      if (questionError || !questionRow) {
        throw new ApiError(500, 'Unable to save assignment question.')
      }

      const optionRows = (question.options ?? []).map((option, optionIndex) => ({
        question_id: questionRow.id,
        option_text: option.optionText,
        is_correct: option.isCorrect,
        position: optionIndex,
      }))

      if (optionRows.length > 0) {
        const { error: optionsError } = await supabase.from('assignment_options').insert(optionRows)
        if (optionsError) {
          throw new ApiError(500, 'Unable to save assignment options.')
        }
      }
    }

    const { error: recipientsError } = await supabase.from('assignment_recipients').insert(
      recipients.map((studentId) => ({
        assignment_id: assignment.id,
        student_id: studentId,
      })),
    )

    if (recipientsError) {
      throw new ApiError(500, 'Unable to assign students.')
    }

    return toAssignmentRecord(assignment, recipients.length)
  },

  async getStudentDashboard(studentId: string): Promise<StudentDashboardPayload> {
    const supabase = getSupabaseAdminClient()
    const { data: student, error } = await supabase
      .from('students')
      .select('*, classes!inner(name, group_name), profiles!students_teacher_id_fkey(full_name)')
      .eq('id', studentId)
      .maybeSingle()

    if (error || !student) {
      throw new ApiError(404, 'Student not found.')
    }

    const classId = student.class_id as string
    const [ratingResult, allStudentsResult, assignmentRows, feedbackRows] = await Promise.all([
      supabase
        .from('monthly_ratings')
        .select('student_id, total_score, completed_tasks_count')
        .eq('class_id', classId)
        .eq('period_month', currentMonthStart()),
      supabase.from('students').select('*').eq('class_id', classId).eq('status', 'active'),
      this.listAssignmentsForStudent(studentId),
      this.listFeedback(studentId),
    ])

    if (ratingResult.error || allStudentsResult.error) {
      throw new ApiError(500, 'Unable to load student dashboard.')
    }

    const ratings: Map<string, { totalScore: number; completedTasksCount: number }> = new Map(
      (ratingResult.data ?? []).map((row: any) => [
        row.student_id as string,
        {
          totalScore: Number(row.total_score ?? 0),
          completedTasksCount: Number(row.completed_tasks_count ?? 0),
        },
      ]),
    )
    const studentRows = allStudentsResult.data ?? []
    const allStudents = studentRows.map((row: any) => {
      const rating = ratings.get(row.id as string)
      return toStudentRecord(row, rating?.totalScore ?? 0, rating?.completedTasksCount)
    })
    const leaderboard = classRepository.buildLeaderboard(allStudents)
    const rank = leaderboard.find((entry) => entry.studentId === studentId)?.rank ?? null
    const currentRating = ratings.get(studentId)

    return {
      student: {
        ...toStudentRecord(student, currentRating?.totalScore ?? 0, currentRating?.completedTasksCount),
        className: (student.classes as any).name as string,
        groupName: (student.classes as any).group_name as string,
        teacherName: ((student.profiles as any)?.full_name as string | null) ?? null,
      },
      rank,
      activeAssignments: assignmentRows.filter((assignment) => assignment.studentSubmissionStatus !== 'graded'),
      completedAssignments: assignmentRows.filter((assignment) => assignment.studentSubmissionStatus === 'graded'),
      leaderboard: leaderboard.slice(0, 10),
      feedback: feedbackRows,
    }
  },

  async listAssignmentsForStudent(studentId: string): Promise<StudentAssignmentRecord[]> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('assignment_recipients')
      .select('assignments!inner(*)')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false })

    if (error) {
      throw new ApiError(500, 'Unable to load assignments.')
    }

    return Promise.all(
      (data ?? []).map(async (row: any) => {
        const assignment = row.assignments
        const [attemptCount, latestSubmission] = await Promise.all([
          this.countAttempts(assignment.id as string, studentId),
          this.getLatestSubmission(assignment.id as string, studentId),
        ])

        return {
          ...toAssignmentRecord(assignment),
          attemptCount,
          attemptsRemaining: Math.max(0, Number(assignment.max_attempts ?? 2) - attemptCount),
          studentSubmissionStatus: (latestSubmission?.status as SubmissionStatus | null) ?? null,
          scoreAwarded: Number(latestSubmission?.score_awarded ?? 0),
        }
      }),
    )
  },

  async getStudentAssignment(studentId: string, assignmentId: string) {
    const supabase = getSupabaseAdminClient()
    const { data: recipient, error } = await supabase
      .from('assignment_recipients')
      .select('assignments!inner(*)')
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load assignment.')
    }

    if (!recipient) {
      throw new ApiError(404, 'Assignment not found.')
    }

    const assignment = (recipient as any).assignments
    const [questions, attemptCount, latestSubmission] = await Promise.all([
      loadQuestions(assignmentId),
      this.countAttempts(assignmentId, studentId),
      this.getLatestSubmission(assignmentId, studentId),
    ])

    const orderedQuestions = assignment.randomize_questions ? shuffle(questions) : questions
    const clientQuestions = orderedQuestions.map((question) => ({
      ...question,
      options: assignment.randomize_options ? shuffle(question.options) : question.options,
    }))

    return {
      assignment: {
        ...toAssignmentRecord(assignment),
        attemptCount,
        attemptsRemaining: Math.max(0, Number(assignment.max_attempts ?? 2) - attemptCount),
        studentSubmissionStatus: (latestSubmission?.status as SubmissionStatus | null) ?? null,
        scoreAwarded: Number(latestSubmission?.score_awarded ?? 0),
      },
      questions: clientQuestions,
    }
  },

  async countAttempts(assignmentId: string, studentId: string) {
    const supabase = getSupabaseAdminClient()
    const { count, error } = await supabase
      .from('student_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)

    if (error) {
      throw new ApiError(500, 'Unable to count attempts.')
    }

    return count ?? 0
  },

  async getLatestSubmission(assignmentId: string, studentId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load submission.')
    }

    return data
  },

  async startAttempt(studentId: string, assignmentId: string) {
    const { assignment } = await this.getStudentAssignment(studentId, assignmentId)

    if (assignment.deadlineAt && new Date(assignment.deadlineAt).getTime() < Date.now()) {
      throw new ApiError(403, 'Deadline has passed.')
    }

    if (assignment.attemptCount >= assignment.maxAttempts) {
      throw new ApiError(403, 'You already used all attempts.')
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('student_attempts')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        attempt_number: assignment.attemptCount + 1,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to start attempt.')
    }

    return {
      attemptId: data.id as string,
      attemptNumber: Number(data.attempt_number),
      startedAt: data.started_at as string,
    }
  },

  async submitAssignment(
    studentId: string,
    assignmentId: string,
    input: {
      attemptId?: string | null
      answers?: Record<string, string[] | string>
      writingText?: string | null
      audioUrl?: string | null
      gameScore?: number | null
    },
  ) {
    const detail = await this.getStudentAssignment(studentId, assignmentId)
    const assignment = detail.assignment

    if (assignment.deadlineAt && new Date(assignment.deadlineAt).getTime() < Date.now()) {
      throw new ApiError(403, 'Deadline has passed.')
    }

    const attempt = input.attemptId
      ? await this.getAttempt(studentId, assignmentId, input.attemptId)
      : await this.startAttempt(studentId, assignmentId)

    const startedAt = new Date(attempt.startedAt).getTime()
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000))

    if (assignment.timeLimitMinutes && elapsedSeconds > assignment.timeLimitMinutes * 60) {
      throw new ApiError(403, 'Time is over.')
    }

    const grading = AUTO_GRADED_TYPES.has(assignment.type)
      ? this.gradeAutomatically(detail.questions, assignment.pointsPerCorrect, input.answers ?? {}, input.gameScore)
      : { score: 0, maxScore: this.maxScore(detail.questions, assignment.pointsPerCorrect), status: 'submitted' as const }

    const isSuspicious = AUTO_GRADED_TYPES.has(assignment.type) && detail.questions.length >= 3 && elapsedSeconds < 10
    const supabase = getSupabaseAdminClient()
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        attempt_id: attempt.attemptId,
        status: grading.status,
        answers: input.answers ?? {},
        score_awarded: grading.score,
        max_score: grading.maxScore,
        graded_at: grading.status === 'graded' ? new Date().toISOString() : null,
      })
      .select('*')
      .single()

    if (error || !submission) {
      throw new ApiError(500, 'Unable to save submission.')
    }

    if (assignment.type === 'writing' && input.writingText) {
      await supabase.from('writing_submissions').insert({
        submission_id: submission.id,
        text_content: input.writingText,
        word_count: input.writingText.trim().split(/\s+/).filter(Boolean).length,
      })
    }

    if (assignment.type === 'speaking') {
      await supabase.from('speaking_submissions').insert({
        submission_id: submission.id,
        audio_url: input.audioUrl ?? null,
      })
    }

    if (assignment.type === 'mini_game') {
      await supabase.from('game_sessions').insert({
        assignment_id: assignmentId,
        student_id: studentId,
        game_type: 'quick_quiz',
        state: { answers: input.answers ?? {} },
        score: grading.score,
        completed_at: new Date().toISOString(),
      })
    }

    await supabase
      .from('student_attempts')
      .update({
        ended_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        is_suspicious: isSuspicious,
        suspicious_reason: isSuspicious ? 'Submitted unusually fast.' : null,
      })
      .eq('id', attempt.attemptId)

    if (grading.status === 'graded' && grading.score > 0) {
      await awardScore({
        studentId,
        assignmentId,
        submissionId: submission.id as string,
        score: grading.score,
        source: assignment.type === 'mini_game' ? 'game' : 'auto',
      })
    }

    return {
      submissionId: submission.id as string,
      status: grading.status,
      scoreAwarded: grading.score,
      maxScore: grading.maxScore,
      suspicious: isSuspicious,
    }
  },

  async uploadSpeakingAudio(
    studentId: string,
    assignmentId: string,
    input: { audioBase64: string; mimeType: string },
  ) {
    const detail = await this.getStudentAssignment(studentId, assignmentId)

    if (detail.assignment.type !== 'speaking') {
      throw new ApiError(400, 'Audio upload is only available for speaking assignments.')
    }

    const mimeType = input.mimeType.split(';')[0]
    const extension = AUDIO_MIME_EXTENSIONS[mimeType]

    if (!extension) {
      throw new ApiError(400, 'Unsupported audio format.')
    }

    const base64 = input.audioBase64.includes(',') ? input.audioBase64.split(',').pop()! : input.audioBase64
    const audioBuffer = Buffer.from(base64, 'base64')

    if (audioBuffer.length === 0) {
      throw new ApiError(400, 'Audio recording is empty.')
    }

    if (audioBuffer.length > 6 * 1024 * 1024) {
      throw new ApiError(413, 'Audio recording is too large.')
    }

    const supabase = getSupabaseAdminClient()
    await ensureSpeakingAudioBucket()

    const storagePath = `${assignmentId}/${studentId}/${Date.now()}.${extension}`
    const { error } = await supabase.storage.from(env.SPEAKING_AUDIO_STORAGE_BUCKET).upload(storagePath, audioBuffer, {
      contentType: mimeType,
      upsert: false,
    })

    if (error) {
      throw new ApiError(500, `Unable to upload speaking audio: ${error.message}`)
    }

    const { data } = supabase.storage.from(env.SPEAKING_AUDIO_STORAGE_BUCKET).getPublicUrl(storagePath)

    return {
      audioUrl: data.publicUrl,
      storagePath,
    }
  },

  async getAttempt(studentId: string, assignmentId: string, attemptId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('student_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .maybeSingle()

    if (error || !data) {
      throw new ApiError(404, 'Attempt not found.')
    }

    return {
      attemptId: data.id as string,
      attemptNumber: Number(data.attempt_number),
      startedAt: data.started_at as string,
    }
  },

  gradeAutomatically(
    questions: AssignmentQuestionRecord[],
    pointsPerCorrect: number,
    answers: Record<string, string[] | string>,
    gameScore?: number | null,
  ) {
    if (typeof gameScore === 'number') {
      return { score: Math.max(0, gameScore), maxScore: Math.max(0, gameScore), status: 'graded' as const }
    }

    let score = 0
    let maxScore = 0

    for (const question of questions) {
      const points = question.points ?? pointsPerCorrect
      maxScore += points
      const correctOptionIds = question.options.filter((option) => option.isCorrect).map((option) => option.id)
      const selected = answers[question.id]
      const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : []

      if (selectedAnswersEqual(selectedIds, correctOptionIds)) {
        score += points
      }
    }

    return { score, maxScore, status: 'graded' as const }
  },

  maxScore(questions: AssignmentQuestionRecord[], pointsPerCorrect: number) {
    return questions.reduce((sum, question) => sum + (question.points ?? pointsPerCorrect), 0)
  },

  async listFeedback(studentId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('submissions')
      .select('id, score_awarded, feedback, graded_at, assignments!inner(title)')
      .eq('student_id', studentId)
      .eq('status', 'graded')
      .order('graded_at', { ascending: false })
      .limit(5)

    if (error) {
      throw new ApiError(500, 'Unable to load feedback.')
    }

    return (data ?? []).map((row: any) => ({
      submissionId: row.id as string,
      assignmentTitle: row.assignments.title as string,
      scoreAwarded: Number(row.score_awarded ?? 0),
      feedback: (row.feedback as string | null) ?? null,
      gradedAt: (row.graded_at as string | null) ?? null,
    }))
  },

  async reviewSubmission(
    teacherId: string,
    submissionId: string,
    input: { scoreAwarded: number; feedback?: string | null },
  ) {
    const supabase = getSupabaseAdminClient()
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*, assignments!inner(teacher_id, title)')
      .eq('id', submissionId)
      .maybeSingle()

    if (error || !submission) {
      throw new ApiError(404, 'Submission not found.')
    }

    if ((submission.assignments as any).teacher_id !== teacherId) {
      throw new ApiError(403, 'You cannot review this submission.')
    }

    const previousScore = Number(submission.score_awarded ?? 0)
    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'graded',
        score_awarded: input.scoreAwarded,
        feedback: input.feedback ?? null,
        graded_by: teacherId,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select('*')
      .single()

    if (updateError || !updated) {
      throw new ApiError(500, 'Unable to review submission.')
    }

    await awardScore({
      studentId: updated.student_id as string,
      assignmentId: updated.assignment_id as string,
      submissionId,
      score: input.scoreAwarded,
      source: 'teacher',
      note: input.feedback ?? null,
      previousScore,
    })

    return updated
  },

  async listPendingSubmissions(teacherId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('submissions')
      .select('*, assignments!inner(teacher_id, title, type), students!inner(full_name)')
      .eq('assignments.teacher_id', teacherId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    if (error) {
      if (isClassSchemaMissing(error)) {
        throw classSchemaMigrationError()
      }
      throw new ApiError(500, 'Unable to load pending submissions.')
    }

    const submissionIds = (data ?? []).map((row: any) => row.id as string)
    const assignmentIds = Array.from(new Set((data ?? []).map((row: any) => row.assignment_id as string)))
    const speakingBySubmissionId = new Map<string, { audioUrl: string | null }>()
    const questionsByAssignmentId = new Map<string, Array<{ id: string; questionText: string }>>()

    if (submissionIds.length > 0) {
      const { data: speakingRows, error: speakingError } = await supabase
        .from('speaking_submissions')
        .select('submission_id, audio_url')
        .in('submission_id', submissionIds)

      if (speakingError) {
        throw new ApiError(500, 'Unable to load speaking submissions.')
      }

      for (const row of speakingRows ?? []) {
        speakingBySubmissionId.set(row.submission_id as string, {
          audioUrl: (row.audio_url as string | null) ?? null,
        })
      }
    }

    if (assignmentIds.length > 0) {
      const { data: questionRows, error: questionError } = await supabase
        .from('assignment_questions')
        .select('id, assignment_id, question_text, position')
        .in('assignment_id', assignmentIds)
        .order('position', { ascending: true })

      if (questionError) {
        throw new ApiError(500, 'Unable to load assignment questions.')
      }

      for (const row of questionRows ?? []) {
        const assignmentQuestions = questionsByAssignmentId.get(row.assignment_id as string) ?? []
        assignmentQuestions.push({
          id: row.id as string,
          questionText: row.question_text as string,
        })
        questionsByAssignmentId.set(row.assignment_id as string, assignmentQuestions)
      }
    }

    return (data ?? []).map((row: any) => ({
      id: row.id as string,
      assignmentId: row.assignment_id as string,
      assignmentTitle: row.assignments.title as string,
      assignmentType: row.assignments.type as AssignmentType,
      studentId: row.student_id as string,
      studentName: row.students.full_name as string,
      submittedAt: row.submitted_at as string,
      scoreAwarded: Number(row.score_awarded ?? 0),
      maxScore: Number(row.max_score ?? 0),
      audioUrl: speakingBySubmissionId.get(row.id as string)?.audioUrl ?? null,
      speakingAnswers: toSpeakingAnswers(
        row.answers as Record<string, string[] | string> | null,
        questionsByAssignmentId.get(row.assignment_id as string) ?? [],
      ),
    }))
  },

  async firstActiveSpeakingAssignment(studentId: string) {
    const assignments = await this.listAssignmentsForStudent(studentId)
    return assignments.find((assignment) => assignment.type === 'speaking' && assignment.studentSubmissionStatus !== 'graded') ?? null
  },

  async ensureTeacherOwnsAssignment(teacherId: string, assignmentId: string) {
    return ensureTeacherOwnsAssignment(teacherId, assignmentId)
  },
}

async function ensureSpeakingAudioBucket() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.getBucket(env.SPEAKING_AUDIO_STORAGE_BUCKET)

  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(env.SPEAKING_AUDIO_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: '6MB',
      allowedMimeTypes: Object.keys(AUDIO_MIME_EXTENSIONS),
    })

    if (createError) {
      throw new ApiError(500, `Unable to prepare speaking audio storage: ${createError.message}`)
    }

    return
  }

  if (!data.public) {
    const { error: updateError } = await supabase.storage.updateBucket(env.SPEAKING_AUDIO_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: data.file_size_limit ?? '6MB',
      allowedMimeTypes: Object.keys(AUDIO_MIME_EXTENSIONS),
    })

    if (updateError) {
      throw new ApiError(500, `Unable to publish speaking audio storage: ${updateError.message}`)
    }
  }
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}
