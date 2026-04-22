export type PlanKey = 'free_trial' | 'basic' | 'pro' | 'premium'

export interface PlanConfig {
  key: PlanKey
  name: string
  monthlyCredits: number
  priceMonthlyUsd: number
  description: string
}

export function sortPlans(plans: PlanConfig[]) {
  const order: Record<PlanKey, number> = {
    free_trial: 0,
    basic: 1,
    pro: 2,
    premium: 3,
  }

  return [...plans].sort((left, right) => order[left.key] - order[right.key])
}
