import { FEATURE_MAP, PLAN_MAP, type FeatureKey, type PlanKey } from '@teacher-assistant/shared'
import { featureLabels, getCurrentLanguage, planLabels } from '@/lib/i18n'

function getLocale() {
  return getCurrentLanguage() === 'en' ? 'en-US' : 'uz-UZ'
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return getCurrentLanguage() === 'en' ? 'Not set' : 'Belgilanmagan'
  }

  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatCurrencyUzs(value: number) {
  const formattedValue = new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: 0,
  }).format(value).replace(/[\u00A0\u202F]/g, ' ')

  return getCurrentLanguage() === 'en' ? `${formattedValue} UZS` : `${formattedValue} so'm`
}

export function getFeatureLabel(featureKey: FeatureKey) {
  return featureLabels[getCurrentLanguage()][featureKey] ?? FEATURE_MAP[featureKey]?.label ?? featureKey
}

export function getPlanName(planKey: PlanKey | null | undefined) {
  if (!planKey) {
    return getCurrentLanguage() === 'en' ? 'No plan' : "Tarif yo'q"
  }

  return planLabels[getCurrentLanguage()][planKey] ?? PLAN_MAP[planKey]?.name ?? planKey
}
