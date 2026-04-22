import type { PlanDefinition, PlanKey } from './types.js'

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: 'free_trial',
    name: 'Bepul Sinov',
    monthlyCredits: 12,
    priceMonthlyUsd: 0,
    description: 'Platformani sinab ko‘rish uchun yetarli kreditlar bilan tanishing.',
  },
  {
    key: 'basic',
    name: 'Boshlang‘ich',
    monthlyCredits: 80,
    priceMonthlyUsd: 12,
    description: 'Muntazam rejalash va tezkor sinf yordamini istagan o‘qituvchilar uchun.',
  },
  {
    key: 'pro',
    name: 'Pro',
    monthlyCredits: 220,
    priceMonthlyUsd: 24,
    description: 'Haftalik rejalash, fikr-mulohaza va eksport ishlari uchun muvozanatli tarif.',
    highlight: 'Eng ommabop',
  },
  {
    key: 'premium',
    name: 'Premium',
    monthlyCredits: 520,
    priceMonthlyUsd: 49,
    description: 'Ko‘p foydalanadigan foydalanuvchilar, kafedralar va keng ko‘lamli ishlar uchun.',
  },
]

export const PLAN_MAP = Object.fromEntries(
  PLAN_DEFINITIONS.map((plan) => [plan.key, plan]),
) as Record<PlanKey, PlanDefinition>
