import { PLAN_MAP, type PlanKey } from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

export interface PlanConfigRecord {
  key: PlanKey
  name: string
  monthlyCredits: number
  priceMonthlyUzs: number
  description: string
}

export const plansRepository = {
  async listAll(): Promise<PlanConfigRecord[]> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .select('key, name, monthly_credits, price_monthly_uzs, description')
      .order('monthly_credits', { ascending: true })

    if (error) {
      throw new ApiError(500, 'Unable to load plans.')
    }

    return (data ?? []).map((row: any) => ({
      key: row.key as PlanKey,
      name: row.name as string,
      monthlyCredits: Number(row.monthly_credits ?? 0),
      priceMonthlyUzs: Number(row.price_monthly_uzs ?? 0),
      description: row.description as string,
    }))
  },

  async findByKey(key: PlanKey): Promise<PlanConfigRecord | null> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('plans')
      .select('key, name, monthly_credits, price_monthly_uzs, description')
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
      priceMonthlyUzs: Number(data.price_monthly_uzs ?? 0),
      description: data.description as string,
    }
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
          price_monthly_uzs: input.priceMonthlyUzs,
          description: input.description,
        },
        { onConflict: 'key' },
      )
      .select('key, name, monthly_credits, price_monthly_uzs, description')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to update plan.')
    }

    return {
      key: data.key as PlanKey,
      name: data.name as string,
      monthlyCredits: Number(data.monthly_credits ?? PLAN_MAP[key].monthlyCredits),
      priceMonthlyUzs: Number(data.price_monthly_uzs ?? PLAN_MAP[key].priceMonthlyUzs),
      description: data.description as string,
    }
  },
}
