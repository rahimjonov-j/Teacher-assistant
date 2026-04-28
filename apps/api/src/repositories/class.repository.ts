import type {
  ActiveStudentBuckets,
  AssignmentRecord,
  AssignmentType,
  ClassDetailPayload,
  ClassRecord,
  ClassesPayload,
  LeaderboardEntry,
  PlanKey,
  StudentRecord,
  TeacherClassSummary,
} from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'
import { generatePassword, hashPassword, verifyPassword } from '../utils/student-security.js'
import { subscriptionsRepository } from './subscriptions.repository.js'

const CLASS_LIMITS: Record<PlanKey, number | null> = {
  free_trial: 1,
  basic: 4,
  pro: 10,
  premium: null,
}

const MANUAL_ASSIGNMENT_TYPES = new Set<AssignmentType>(['open_question', 'writing', 'speaking'])

export function isClassSchemaMissing(error: unknown) {
  const maybeError = error as { code?: string; message?: string } | null
  return maybeError?.code === 'PGRST205' || maybeError?.message?.includes("Could not find the table 'public.classes'")
}

export function classSchemaMigrationError() {
  return new ApiError(503, 'Class database tables are not created yet. Apply supabase/migrations/20260428_class_management.sql.')
}

function currentMonthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

function toClassRecord(row: any, studentCount = 0, monthlyScore = 0): ClassRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    gradeLevel: (row.grade_level as string | null) ?? null,
    groupName: row.group_name as string,
    status: row.status as 'active' | 'archived',
    studentCount,
    monthlyScore,
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

async function ensureTeacherOwnsClass(teacherId: string, classId: string) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (error) {
    throw new ApiError(500, 'Unable to load class.')
  }

  if (!data) {
    throw new ApiError(404, 'Class not found.')
  }

  return data
}

async function getTeacherClass(teacherId: string, classId: string) {
  return ensureTeacherOwnsClass(teacherId, classId)
}

async function getRatingsForStudents(studentIds: string[]): Promise<Map<string, { totalScore: number; completedTasksCount: number }>> {
  if (studentIds.length === 0) {
    return new Map()
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('monthly_ratings')
    .select('student_id, total_score, completed_tasks_count')
    .eq('period_month', currentMonthStart())
    .in('student_id', studentIds)

  if (error) {
    throw new ApiError(500, 'Unable to load ratings.')
  }

  return new Map(
    (data ?? []).map((row: any) => [
      row.student_id as string,
      {
        totalScore: Number(row.total_score ?? 0),
        completedTasksCount: Number(row.completed_tasks_count ?? 0),
      },
    ]),
  )
}

async function countRows(table: string, column: string, values: string[]) {
  if (values.length === 0) {
    return new Map<string, number>()
  }

  const supabase = getSupabaseAdminClient()
  const counts = new Map<string, number>()

  await Promise.all(
    values.map(async (value) => {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, value)
      if (error) {
        throw new ApiError(500, `Unable to count ${table}.`)
      }
      counts.set(value, count ?? 0)
    }),
  )

  return counts
}

export const classRepository = {
  async getClassLimit(teacherId: string) {
    const subscription = await subscriptionsRepository.getActiveByUserId(teacherId)
    const planKey = subscription?.planKey ?? 'free_trial'
    return {
      planKey,
      max: CLASS_LIMITS[planKey],
    }
  },

  async listClasses(teacherId: string): Promise<ClassesPayload> {
    const supabase = getSupabaseAdminClient()
    const [{ data, error }, limit] = await Promise.all([
      supabase.from('classes').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
      this.getClassLimit(teacherId),
    ])

    if (error) {
      if (isClassSchemaMissing(error)) {
        throw classSchemaMigrationError()
      }
      throw new ApiError(500, 'Unable to load classes.')
    }

    const rows = data ?? []
    const classIds = rows.map((row: any) => row.id as string)
    const studentCounts = await countRows('students', 'class_id', classIds)
    const ratingTotals = await this.getClassMonthlyTotals(classIds)

    return {
      classes: rows.map((row: any) =>
        toClassRecord(row, studentCounts.get(row.id as string) ?? 0, ratingTotals.get(row.id as string) ?? 0),
      ),
      limits: {
        planKey: limit.planKey,
        current: rows.filter((row: any) => row.status === 'active').length,
        max: limit.max,
        canCreate: limit.max === null || rows.filter((row: any) => row.status === 'active').length < limit.max,
      },
    }
  },

  async getClassMonthlyTotals(classIds: string[]) {
    const totals = new Map<string, number>()
    if (classIds.length === 0) {
      return totals
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('monthly_ratings')
      .select('class_id, total_score')
      .eq('period_month', currentMonthStart())
      .in('class_id', classIds)

    if (error) {
      throw new ApiError(500, 'Unable to load class ratings.')
    }

    for (const row of data ?? []) {
      const classId = row.class_id as string
      totals.set(classId, (totals.get(classId) ?? 0) + Number(row.total_score ?? 0))
    }

    return totals
  },

  async getTeacherClassSummary(teacherId: string): Promise<TeacherClassSummary> {
    const supabase = getSupabaseAdminClient()
    const [classes, students, submissions, assignments] = await Promise.all([
      supabase.from('classes').select('id').eq('teacher_id', teacherId).eq('status', 'active'),
      supabase.from('students').select('id, last_active_at').eq('teacher_id', teacherId).eq('status', 'active'),
      supabase
        .from('submissions')
        .select('id, status, assignments!inner(teacher_id, type)')
        .eq('assignments.teacher_id', teacherId),
      supabase.from('assignments').select('id, status').eq('teacher_id', teacherId),
    ])

    if ([classes.error, students.error, submissions.error, assignments.error].some(isClassSchemaMissing)) {
      throw classSchemaMigrationError()
    }

    if (classes.error || students.error || submissions.error || assignments.error) {
      throw new ApiError(500, 'Unable to load class dashboard summary.')
    }

    const sinceWeek = Date.now() - 1000 * 60 * 60 * 24 * 7
    const activeStudents = (students.data ?? []).filter((row: any) => {
      const lastActive = row.last_active_at ? new Date(row.last_active_at as string).getTime() : 0
      return lastActive >= sinceWeek
    }).length

    const pendingSubmissions = (submissions.data ?? []).filter((row: any) => {
      const assignmentType = row.assignments?.type as AssignmentType | undefined
      return row.status === 'submitted' && assignmentType && MANUAL_ASSIGNMENT_TYPES.has(assignmentType)
    }).length

    const sentAssignments = (assignments.data ?? []).filter((row: any) => row.status === 'sent').length
    const gradedOrSubmitted = (submissions.data ?? []).filter((row: any) =>
      ['submitted', 'graded'].includes(row.status as string),
    ).length
    const totalRecipients = await this.countRecipientsForTeacher(teacherId)
    const topStudent = await this.getMonthlyTopStudent(teacherId)

    return {
      totalClasses: classes.data?.length ?? 0,
      totalStudents: students.data?.length ?? 0,
      activeStudents,
      pendingSubmissions,
      monthlyTopStudent: topStudent,
      assignmentsSent: sentAssignments,
      averageCompletionRate: totalRecipients === 0 ? 0 : Math.round((gradedOrSubmitted / totalRecipients) * 100),
    }
  },

  async countRecipientsForTeacher(teacherId: string) {
    const supabase = getSupabaseAdminClient()
    const { count, error } = await supabase
      .from('assignment_recipients')
      .select('id, assignments!inner(teacher_id)', { count: 'exact', head: true })
      .eq('assignments.teacher_id', teacherId)

    if (error) {
      throw new ApiError(500, 'Unable to count assignment recipients.')
    }

    return count ?? 0
  },

  async getMonthlyTopStudent(teacherId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('monthly_ratings')
      .select('student_id, total_score, students!inner(full_name, teacher_id)')
      .eq('period_month', currentMonthStart())
      .eq('students.teacher_id', teacherId)
      .order('total_score', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load top student.')
    }

    if (!data) {
      return null
    }

    return {
      studentId: data.student_id as string,
      fullName: (data.students as any).full_name as string,
      totalMonthlyScore: Number(data.total_score ?? 0),
    }
  },

  async createClass(teacherId: string, input: { name: string; groupName: string; gradeLevel?: string | null }) {
    const payload = await this.listClasses(teacherId)

    if (!payload.limits.canCreate) {
      throw new ApiError(402, 'Class limit reached. Upgrade your plan to create more classes.')
    }

    const supabase = getSupabaseAdminClient()
    const { data: group, error: groupError } = await supabase
      .from('class_groups')
      .upsert(
        {
          teacher_id: teacherId,
          name: input.groupName,
          grade_level: input.gradeLevel ?? null,
        },
        { onConflict: 'teacher_id,name' },
      )
      .select('*')
      .single()

    if (groupError || !group) {
      throw new ApiError(500, 'Unable to save class group.')
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: teacherId,
        class_group_id: group.id,
        name: input.name,
        grade_level: input.gradeLevel ?? null,
        group_name: input.groupName,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(400, error?.message ?? 'Unable to create class.')
    }

    return toClassRecord(data)
  },

  async getClassDetail(teacherId: string, classId: string): Promise<ClassDetailPayload> {
    const classRow = await ensureTeacherOwnsClass(teacherId, classId)
    const supabase = getSupabaseAdminClient()
    const [studentsResult, assignmentsResult] = await Promise.all([
      supabase.from('students').select('*').eq('class_id', classId).order('full_name', { ascending: true }),
      supabase.from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false }),
    ])

    if (studentsResult.error || assignmentsResult.error) {
      throw new ApiError(500, 'Unable to load class detail.')
    }

    const studentRows = studentsResult.data ?? []
    const assignmentRows = assignmentsResult.data ?? []
    const studentIds = studentRows.map((row: any) => row.id as string)
    const assignmentIds = assignmentRows.map((row: any) => row.id as string)
    const ratings = await getRatingsForStudents(studentIds)
    const [recipientCounts, submittedCounts, gradedCounts] = await Promise.all([
      countRows('assignment_recipients', 'assignment_id', assignmentIds),
      this.countSubmissionsByAssignment(assignmentIds, ['submitted', 'graded']),
      this.countSubmissionsByAssignment(assignmentIds, ['graded']),
    ])

    const allStudents = studentRows.map((row: any) => {
      const rating = ratings.get(row.id as string)
      return toStudentRecord(row, rating?.totalScore ?? 0, rating?.completedTasksCount)
    })

    const leaderboard = this.buildLeaderboard(allStudents)
    const activeStudents = this.buildActiveBuckets(allStudents)
    const assignments = assignmentRows.map((row: any) =>
      toAssignmentRecord(
        row,
        recipientCounts.get(row.id as string) ?? 0,
        submittedCounts.get(row.id as string) ?? 0,
        gradedCounts.get(row.id as string) ?? 0,
      ),
    )

    return {
      class: toClassRecord(
        classRow,
        allStudents.length,
        leaderboard.reduce((sum, row) => sum + row.totalMonthlyScore, 0),
      ),
      leaderboard,
      allStudents,
      activeStudents,
      assignments,
    }
  },

  async getClassForTeacher(teacherId: string, classId: string) {
    const row = await getTeacherClass(teacherId, classId)
    return toClassRecord(row)
  },

  buildLeaderboard(students: StudentRecord[]): LeaderboardEntry[] {
    return [...students]
      .sort((left, right) => right.totalMonthlyScore - left.totalMonthlyScore || left.fullName.localeCompare(right.fullName))
      .map((student, index) => ({
        rank: index + 1,
        studentId: student.id,
        fullName: student.fullName,
        totalMonthlyScore: student.totalMonthlyScore,
        allTimeScore: student.allTimeScore,
        completedTasksCount: student.completedAssignments,
      }))
  },

  buildActiveBuckets(students: StudentRecord[]): ActiveStudentBuckets {
    const now = Date.now()
    const dayMs = 1000 * 60 * 60 * 24
    const activeSince = (student: StudentRecord, days: number) =>
      student.lastActiveAt ? now - new Date(student.lastActiveAt).getTime() <= dayMs * days : false

    return {
      today: students.filter((student) => activeSince(student, 1)),
      week: students.filter((student) => activeSince(student, 7)),
      month: students.filter((student) => activeSince(student, 31)),
    }
  },

  async countSubmissionsByAssignment(assignmentIds: string[], statuses: string[]) {
    const counts = new Map<string, number>()
    if (assignmentIds.length === 0) {
      return counts
    }

    const supabase = getSupabaseAdminClient()
    await Promise.all(
      assignmentIds.map(async (assignmentId) => {
        const { count, error } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('assignment_id', assignmentId)
          .in('status', statuses)

        if (error) {
          throw new ApiError(500, 'Unable to count submissions.')
        }

        counts.set(assignmentId, count ?? 0)
      }),
    )

    return counts
  },

  async addStudent(teacherId: string, classId: string, fullName: string) {
    await ensureTeacherOwnsClass(teacherId, classId)
    const supabase = getSupabaseAdminClient()
    const password = generatePassword()
    const credentials = hashPassword(password)
    const login = await this.generateUniqueLogin(fullName)

    const { data, error } = await supabase
      .from('students')
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        full_name: fullName,
        login,
        password_hash: credentials.hash,
        password_salt: credentials.salt,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(400, error?.message ?? 'Unable to add student.')
    }

    return {
      student: toStudentRecord(data),
      credentials: { login, password },
    }
  },

  async generateUniqueLogin(fullName: string) {
    const supabase = getSupabaseAdminClient()
    const base = fullName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('.')
      .replace(/_+/g, '.')
      .replace(/\.+/g, '.')
      .slice(0, 24) || 'student'

    for (let index = 0; index < 12; index += 1) {
      const suffix = index === 0 ? randomNumericSuffix() : `${randomNumericSuffix()}${index}`
      const login = `${base}.${suffix}`
      const { data, error } = await supabase.from('students').select('id').eq('login', login).maybeSingle()
      if (error) {
        throw new ApiError(500, 'Unable to verify login.')
      }
      if (!data) {
        return login
      }
    }

    return `${base}.${Date.now().toString(36)}`
  },

  async regenerateStudentPassword(teacherId: string, studentId: string) {
    const student = await this.getTeacherStudent(teacherId, studentId)
    const password = generatePassword()
    const credentials = hashPassword(password)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from('students')
      .update({ password_hash: credentials.hash, password_salt: credentials.salt })
      .eq('id', student.id)

    if (error) {
      throw new ApiError(500, 'Unable to regenerate password.')
    }

    return { login: student.login, password }
  },

  async transferStudent(teacherId: string, studentId: string, toClassId: string, note?: string | null) {
    const [student] = await Promise.all([
      this.getTeacherStudent(teacherId, studentId),
      ensureTeacherOwnsClass(teacherId, toClassId),
    ])

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from('students')
      .update({ class_id: toClassId, status: 'active' })
      .eq('id', studentId)
      .eq('teacher_id', teacherId)

    if (error) {
      throw new ApiError(500, 'Unable to transfer student.')
    }

    await supabase.from('student_class_history').insert({
      student_id: studentId,
      from_class_id: student.classId,
      to_class_id: toClassId,
      transferred_by: teacherId,
      note: note ?? null,
    })

    return this.getTeacherStudent(teacherId, studentId)
  },

  async getTeacherStudent(teacherId: string, studentId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('teacher_id', teacherId)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load student.')
    }

    if (!data) {
      throw new ApiError(404, 'Student not found.')
    }

    return toStudentRecord(data)
  },

  async getStudentById(studentId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load student.')
    }

    return data
      ? {
          ...toStudentRecord(data),
          teacherId: data.teacher_id as string,
          passwordHash: data.password_hash as string,
          passwordSalt: data.password_salt as string,
        }
      : null
  },

  async findStudentByLogin(login: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('login', login.toLowerCase().trim())
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load student.')
    }

    return data
      ? {
          ...toStudentRecord(data),
          teacherId: data.teacher_id as string,
          passwordHash: data.password_hash as string,
          passwordSalt: data.password_salt as string,
        }
      : null
  },

  async verifyStudentCredentials(login: string, password: string) {
    const student = await this.findStudentByLogin(login)

    if (!student || !verifyPassword(password, student.passwordSalt, student.passwordHash)) {
      throw new ApiError(401, 'Invalid student login or password.')
    }

    if (student.status !== 'active') {
      throw new ApiError(403, 'Student account is not active.')
    }

    const supabase = getSupabaseAdminClient()
    await supabase.from('students').update({ last_active_at: new Date().toISOString() }).eq('id', student.id)

    return student
  },

  async linkTelegramStudent(studentId: string, telegramUserId: number, telegramUsername?: string | null) {
    const supabase = getSupabaseAdminClient()
    const student = await this.getStudentById(studentId)

    if (!student) {
      throw new ApiError(404, 'Student not found.')
    }

    const { error } = await supabase.from('telegram_accounts').upsert(
      {
        student_id: studentId,
        telegram_user_id: String(telegramUserId),
        telegram_username: telegramUsername ?? null,
        linked_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_user_id' },
    )

    if (error) {
      throw new ApiError(500, 'Unable to link Telegram account.')
    }
  },

  async findStudentByTelegramUserId(telegramUserId: number) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('telegram_accounts')
      .select('student_id')
      .eq('telegram_user_id', String(telegramUserId))
      .not('student_id', 'is', null)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load Telegram student account.')
    }

    if (!data?.student_id) {
      return null
    }

    return this.getStudentById(data.student_id as string)
  },
}

function randomNumericSuffix() {
  return String(Math.floor(1000 + Math.random() * 9000))
}
