export const featureKeys = [
  'quiz',
  'lesson_plan',
  'writing_feedback',
  'speaking_questions',
  'pdf_export',
] as const

export type FeatureKey = (typeof featureKeys)[number]

export const planKeys = ['free_trial', 'basic', 'pro', 'premium'] as const

export type PlanKey = (typeof planKeys)[number]

export type AppRole = 'teacher' | 'admin'

export const assignmentTypes = [
  'multiple_choice',
  'variant_test',
  'open_question',
  'writing',
  'speaking',
  'mini_game',
] as const

export type AssignmentType = (typeof assignmentTypes)[number]

export const assignmentStatuses = ['draft', 'sent', 'closed'] as const

export type AssignmentStatus = (typeof assignmentStatuses)[number]

export const submissionStatuses = ['assigned', 'in_progress', 'submitted', 'graded', 'blocked'] as const

export type SubmissionStatus = (typeof submissionStatuses)[number]

export type StudentStatus = 'active' | 'inactive' | 'transferred'

export interface PlanDefinition {
  key: PlanKey
  name: string
  monthlyCredits: number
  priceMonthlyUzs: number
  description: string
  highlight?: string
}

export interface FeatureDefinition {
  key: FeatureKey
  label: string
  description: string
  creditCost: number
  defaultModelTier: 'light' | 'strong'
  inputLabel: string
  helperText: string
}

export interface TeacherProfile {
  id: string
  email: string
  fullName: string | null
  schoolName: string | null
  gradeFocus: string | null
  avatarUrl: string | null
  role: AppRole
  timezone: string | null
}

export interface SubscriptionSnapshot {
  planKey: PlanKey
  planName: string
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
  creditsTotal: number
  creditsRemaining: number
  creditsUsed: number
  renewsAt: string | null
}

export interface GeneratedContentRecord {
  id: string
  title: string
  featureKey: FeatureKey
  prompt: string
  outputMarkdown: string
  level: string | null
  additionalInstructions: string | null
  createdAt: string
  modelName: string
  creditsConsumed: number
  pdfUrl: string | null
}

export interface UsageLogRecord {
  id: string
  featureKey: FeatureKey
  creditsConsumed: number
  modelName: string
  source: 'web' | 'admin'
  createdAt: string
}

export interface TeacherDashboardPayload {
  profile: TeacherProfile
  subscription: SubscriptionSnapshot | null
  quickActions: FeatureDefinition[]
  recentContent: GeneratedContentRecord[]
  usageSummary: {
    totalRequestsThisMonth: number
    mostUsedFeature: FeatureKey | null
    creditsRemaining: number
  }
  classSummary?: TeacherClassSummary
}

export interface TeacherClassSummary {
  totalClasses: number
  totalStudents: number
  activeStudents: number
  pendingSubmissions: number
  monthlyTopStudent: {
    studentId: string
    fullName: string
    totalMonthlyScore: number
  } | null
  assignmentsSent: number
  averageCompletionRate: number
}

export interface ClassRecord {
  id: string
  name: string
  gradeLevel: string | null
  groupName: string
  status: 'active' | 'archived'
  studentCount: number
  monthlyScore: number
  createdAt: string
}

export interface StudentRecord {
  id: string
  classId: string
  fullName: string
  login: string
  password?: string | null
  status: StudentStatus
  totalMonthlyScore: number
  allTimeScore: number
  completedAssignments: number
  lastActiveAt: string | null
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  studentId: string
  fullName: string
  totalMonthlyScore: number
  allTimeScore: number
  completedTasksCount: number
}

export interface ActiveStudentBuckets {
  today: StudentRecord[]
  week: StudentRecord[]
  month: StudentRecord[]
}

export interface ClassDetailPayload {
  class: ClassRecord
  leaderboard: LeaderboardEntry[]
  allStudents: StudentRecord[]
  activeStudents: ActiveStudentBuckets
  assignments: AssignmentRecord[]
}

export interface ClassesPayload {
  classes: ClassRecord[]
  limits: {
    planKey: PlanKey
    current: number
    max: number | null
    canCreate: boolean
  }
}

export interface StudentCredentials {
  login: string
  password: string
}

export interface AssignmentRecord {
  id: string
  classId: string | null
  title: string
  description: string | null
  type: AssignmentType
  status: AssignmentStatus
  pointsPerCorrect: number
  deadlineAt: string | null
  timeLimitMinutes: number | null
  maxAttempts: number
  randomizeQuestions: boolean
  randomizeOptions: boolean
  recipientsCount: number
  submittedCount: number
  gradedCount: number
  createdAt: string
}

export interface AssignmentQuestionRecord {
  id: string
  assignmentId: string
  questionText: string
  variantKey: string | null
  position: number
  points: number | null
  options: AssignmentOptionRecord[]
}

export interface AssignmentOptionRecord {
  id: string
  questionId: string
  optionText: string
  isCorrect: boolean
  position: number
}

export interface StudentAssignmentRecord extends AssignmentRecord {
  attemptCount: number
  attemptsRemaining: number
  studentSubmissionStatus: SubmissionStatus | null
  scoreAwarded: number
}

export interface StudentDashboardPayload {
  student: StudentRecord & {
    className: string
    groupName: string
    teacherName: string | null
  }
  rank: number | null
  activeAssignments: StudentAssignmentRecord[]
  completedAssignments: StudentAssignmentRecord[]
  leaderboard: LeaderboardEntry[]
  feedback: Array<{
    submissionId: string
    assignmentTitle: string
    scoreAwarded: number
    feedback: string | null
    gradedAt: string | null
  }>
}

export interface AnalyticsKpi {
  label: string
  value: number | string
  delta?: string
}

export interface AdminOverviewPayload {
  kpis: AnalyticsKpi[]
  topTeachers: Array<{
    userId: string
    fullName: string | null
    email: string
    totalRequests: number
    creditsConsumed: number
    totalTokens: number
  }>
  featureUsage: Array<{
    featureKey: FeatureKey
    totalRequests: number
    creditsConsumed: number
    totalTokens: number
  }>
  recentActivity: Array<{
    id: string
    teacherName: string | null
    featureKey: FeatureKey
    creditsConsumed: number
    totalTokens: number
    createdAt: string
  }>
  usageTrend: Array<{
    period: string
    totalRequests: number
    creditsConsumed: number
    totalTokens: number
  }>
}

export interface GeneratorRequest {
  featureKey: FeatureKey
  topic: string
  gradeOrLevel?: string
  additionalInstructions?: string
}

export interface GeneratorResponse {
  content: GeneratedContentRecord
  subscription: SubscriptionSnapshot | null
}
