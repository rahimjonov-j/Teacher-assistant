import type { FeatureDefinition } from './types.js'

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: 'quiz',
    label: 'Test Yaratish',
    description: 'Aniq javob tuzilmasiga ega tezkor testlar yarating.',
    creditCost: 1,
    defaultModelTier: 'light',
    inputLabel: 'Mavzu yoki dars maqsadi',
    helperText: 'Tezkor test uchun.',
  },
  {
    key: 'lesson_plan',
    label: 'Dars Rejasi',
    description: 'Vaqt taqsimoti va faoliyatlar bilan tartibli dars rejasi tuzing.',
    creditCost: 2,
    defaultModelTier: 'strong',
    inputLabel: 'Dars mavzusi yoki standart',
    helperText: 'Qisqa va tartibli reja.',
  },
  {
    key: 'writing_feedback',
    label: 'Yozma Ish Fikri',
    description: 'Insho va yozma ishlar uchun konstruktiv fikr-mulohaza yarating.',
    creditCost: 2,
    defaultModelTier: 'strong',
    inputLabel: "O'quvchi matni yoki topshiriq",
    helperText: 'Qisqa feedback uchun.',
  },
  {
    key: 'speaking_questions',
    label: 'Gapirish Savollari',
    description: 'Sinf uchun suhbat savollarini yarating.',
    creditCost: 1,
    defaultModelTier: 'light',
    inputLabel: "Mavzu yoki bo'lim g'oyasi",
    helperText: 'Suhbatni boshlash uchun.',
  },
  {
    key: 'pdf_export',
    label: 'PDF Eksport',
    description: "Saqlangan materialni PDF ko'rinishida eksport qiling.",
    creditCost: 3,
    defaultModelTier: 'light',
    inputLabel: 'Saqlangan material tanlovi',
    helperText: 'Yuklab olish uchun.',
  },
]

export const FEATURE_MAP = Object.fromEntries(
  FEATURE_DEFINITIONS.map((feature) => [feature.key, feature]),
)
