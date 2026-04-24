import { format } from 'date-fns'
import { FEATURE_MAP, PLAN_MAP, type FeatureKey, type PlanKey } from '@teacher-assistant/shared'

const wholeNumberFormatterUzs = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
})

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Belgilanmagan'
  }

  return format(new Date(value), 'MMM d, yyyy')
}

export function formatRelativeDate(value: string) {
  return format(new Date(value), 'MMM d, HH:mm')
}

export function formatCurrencyUzs(value: number) {
  const formattedValue = wholeNumberFormatterUzs.format(value).replace(/[\u00A0\u202F]/g, ' ')

  return `${formattedValue} so'm`
}

export function getFeatureLabel(featureKey: FeatureKey) {
  return FEATURE_MAP[featureKey]?.label ?? featureKey
}

export function getPlanName(planKey: PlanKey | null | undefined) {
  if (!planKey) {
    return "Tarif yo'q"
  }

  return PLAN_MAP[planKey]?.name ?? planKey
}
