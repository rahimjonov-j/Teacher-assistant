import type { FeatureKey } from './types.js'

export const MODEL_TIERS = {
  light: 'OPENAI_MODEL_LIGHT',
  strong: 'OPENAI_MODEL_STRONG',
} as const

export const DEFAULT_MODEL_STRATEGY: Record<FeatureKey, keyof typeof MODEL_TIERS> = {
  quiz: 'light',
  speaking_questions: 'light',
  lesson_plan: 'strong',
  writing_feedback: 'strong',
  pdf_export: 'light',
}
