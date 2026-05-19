import type { PlanDefinition, PlanKey } from './types.js'

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: 'free_trial',
    name: 'Bepul Sinov',
    monthlyCredits: 12,
    priceMonthlyUzs: 0,
    description: 'Platformani sinab ko‘rish uchun yetarli kreditlar bilan tanishing.',
  },
  {
    key: 'basic',
    name: 'Basic',
    monthlyCredits: 80,
    priceMonthlyUzs: 49000,
    description: "Muntazam rejalash va tezkor sinf yordamini istagan o'qituvchilar uchun.",
  },
  {
    key: 'pro',
    name: 'Pro',
    monthlyCredits: 220,
    priceMonthlyUzs: 119000,
    description: 'Haftalik rejalash, fikr-mulohaza va eksport ishlari uchun muvozanatli tarif.',
    highlight: 'Mashhur',
  },
  {
    key: 'premium',
    name: 'Premium',
    monthlyCredits: 520,
    priceMonthlyUzs: 249000,
    description: "Ko'p foydalanadigan foydalanuvchilar, kafedralar va keng ko'lamli ishlar uchun.",
  },
]

export const PLAN_MAP = Object.fromEntries(
  PLAN_DEFINITIONS.map((plan) => [plan.key, plan]),
) as Record<PlanKey, PlanDefinition>
