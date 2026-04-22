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
  telegramHandle: string | null
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
  source: 'web' | 'telegram' | 'admin'
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
