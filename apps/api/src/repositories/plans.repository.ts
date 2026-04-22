import type { PlanKey } from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

const CURRENT_PRICE_COLUMN = 'price_monthly_uzs'
const LEGACY_PRICE_COLUMN = 'price_monthly_usd'
const LEGACY_UZS_RATE = 10000

export interface PlanConfigRecord {
  key: PlanKey
  name: string
  monthlyCredits: number
  priceMonthlyUzs: number
  description: string
}

type PriceColumnName = typeof CURRENT_PRICE_COLUMN | typeof LEGACY_PRICE_COLUMN

function isMissingColumnError(error: { code?: string; message?: string } | null, column: PriceColumnName) {
  if (!error) {
    return false
  }

  const details = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    details.includes(column)
  )
}

function mapPlanRecord(row: Record<string, unknown>, priceColumn: PriceColumnName): PlanConfigRecord {
  const rawPrice = Number(row[priceColumn] ?? 0)
  const priceMonthlyUzs =
    priceColumn === LEGACY_PRICE_COLUMN ? Math.round(rawPrice * LEGACY_UZS_RATE) : rawPrice

  return {
    key: row.key as PlanKey,
    name: row.name as string,
    monthlyCredits: Number(row.monthly_credits ?? 0),
    priceMonthlyUzs,
    description: row.description as string,
  }
}

export const plansRepository = {
  async listAll(): Promise<PlanConfigRecord[]> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .select(`key, name, monthly_credits, ${CURRENT_PRICE_COLUMN}, description`)
      .order('monthly_credits', { ascending: true })

    if (error && !isMissingColumnError(error, CURRENT_PRICE_COLUMN)) {
      throw new ApiError(500, 'Unable to load plans.')
    }

    if (!error) {
      return (data ?? []).map((row: any) => mapPlanRecord(row, CURRENT_PRICE_COLUMN))
    }

    const legacyResult = await supabase
      .from('plans')
      .select(`key, name, monthly_credits, ${LEGACY_PRICE_COLUMN}, description`)
      .order('monthly_credits', { ascending: true })

    if (legacyResult.error) {
      throw new ApiError(500, 'Unable to load plans.')
    }

    return (legacyResult.data ?? []).map((row: any) => mapPlanRecord(row, LEGACY_PRICE_COLUMN))
  },

  async findByKey(key: PlanKey): Promise<PlanConfigRecord | null> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .select(`key, name, monthly_credits, ${CURRENT_PRICE_COLUMN}, description`)
      .eq('key', key)
      .maybeSingle()

    if (error && !isMissingColumnError(error, CURRENT_PRICE_COLUMN)) {
      throw new ApiError(500, 'Unable to load plan.')
    }

    if (!error) {
      if (!data) {
        return null
      }

      return mapPlanRecord(data as Record<string, unknown>, CURRENT_PRICE_COLUMN)
    }

    const legacyResult = await supabase
      .from('plans')
      .select(`key, name, monthly_credits, ${LEGACY_PRICE_COLUMN}, description`)
      .eq('key', key)
      .maybeSingle()

    if (legacyResult.error) {
      throw new ApiError(500, 'Unable to load plan.')
    }

    if (!legacyResult.data) {
      return null
    }

    return mapPlanRecord(legacyResult.data as Record<string, unknown>, LEGACY_PRICE_COLUMN)
  },

  async updateByKey(
    key: PlanKey,
    input: {
      name: string
      monthlyCredits: number
      priceMonthlyUzs: number
      description: string
    },
  ): Promise<PlanConfigRecord> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .upsert(
        {
          key,
          name: input.name,
          monthly_credits: input.monthlyCredits,
          [CURRENT_PRICE_COLUMN]: input.priceMonthlyUzs,
          description: input.description,
        },
        { onConflict: 'key' },
      )
      .select(`key, name, monthly_credits, ${CURRENT_PRICE_COLUMN}, description`)
      .single()

    if (!error && data) {
      return mapPlanRecord(data as Record<string, unknown>, CURRENT_PRICE_COLUMN)
    }

    if (error && !isMissingColumnError(error, CURRENT_PRICE_COLUMN)) {
      throw new ApiError(500, 'Unable to update plan.')
    }

    const legacyResult = await supabase
      .from('plans')
      .upsert(
        {
          key,
          name: input.name,
          monthly_credits: input.monthlyCredits,
          [LEGACY_PRICE_COLUMN]: input.priceMonthlyUzs / LEGACY_UZS_RATE,
          description: input.description,
        },
        { onConflict: 'key' },
      )
      .select(`key, name, monthly_credits, ${LEGACY_PRICE_COLUMN}, description`)
      .single()

    if (legacyResult.error || !legacyResult.data) {
      throw new ApiError(500, 'Unable to update plan.')
    }

    return mapPlanRecord(legacyResult.data as Record<string, unknown>, LEGACY_PRICE_COLUMN)
  },
}
