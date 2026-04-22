import type { PlanKey } from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

export interface PlanConfigRecord {
  key: PlanKey
  name: string
  monthlyCredits: number
  priceMonthlyUsd: number
  description: string
}

export const plansRepository = {
  async listAll(): Promise<PlanConfigRecord[]> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .select('key, name, monthly_credits, price_monthly_usd, description')
      .order('monthly_credits', { ascending: true })

    if (error) {
      throw new ApiError(500, 'Unable to load plans.')
    }

    return (data ?? []).map((row: any) => ({
      key: row.key as PlanKey,
      name: row.name as string,
      monthlyCredits: Number(row.monthly_credits ?? 0),
      priceMonthlyUsd: Number(row.price_monthly_usd ?? 0),
      description: row.description as string,
    }))
  },

  async findByKey(key: PlanKey): Promise<PlanConfigRecord | null> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .select('key, name, monthly_credits, price_monthly_usd, description')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load plan.')
    }

    if (!data) {
      return null
    }

    return {
      key: data.key as PlanKey,
      name: data.name as string,
      monthlyCredits: Number(data.monthly_credits ?? 0),
      priceMonthlyUsd: Number(data.price_monthly_usd ?? 0),
      description: data.description as string,
    }
  },

  async updateByKey(
    key: PlanKey,
    input: {
      name: string
      monthlyCredits: number
      priceMonthlyUsd: number
      description: string
    },
  ): Promise<PlanConfigRecord> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .update({
        name: input.name,
        monthly_credits: input.monthlyCredits,
        price_monthly_usd: input.priceMonthlyUsd,
        description: input.description,
      })
      .eq('key', key)
      .select('key, name, monthly_credits, price_monthly_usd, description')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to update plan.')
    }

    return {
      key: data.key as PlanKey,
      name: data.name as string,
      monthlyCredits: Number(data.monthly_credits ?? 0),
      priceMonthlyUsd: Number(data.price_monthly_usd ?? 0),
      description: data.description as string,
    }
  },
}
