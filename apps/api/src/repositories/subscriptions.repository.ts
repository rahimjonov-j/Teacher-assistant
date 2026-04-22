import { PLAN_MAP, type FeatureKey, type PlanKey } from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { plansRepository } from './plans.repository.js'
import { ApiError } from '../utils/api-error.js'

export const subscriptionsRepository = {
  async ensureDefaultForUser(userId: string) {
    const existing = await this.getActiveByUserId(userId)

    if (existing) {
      return existing
    }

    const configuredPlan = await plansRepository.findByKey('free_trial')
    const plan = configuredPlan ?? PLAN_MAP.free_trial
    const renewsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_key: plan.key,
        status: 'trialing',
        credits_total: plan.monthlyCredits,
        credits_remaining: plan.monthlyCredits,
        credits_used: 0,
        started_at: new Date().toISOString(),
        renews_at: renewsAt,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to create default subscription.')
    }

    return {
      id: data.id as string,
      userId: data.user_id as string,
      planKey: data.plan_key as PlanKey,
      planName: plan.name,
      status: data.status as 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired',
      creditsTotal: Number(data.credits_total ?? plan.monthlyCredits),
      creditsRemaining: Number(data.credits_remaining ?? 0),
      creditsUsed: Number(data.credits_used ?? 0),
      renewsAt: (data.renews_at as string | null) ?? null,
    }
  },

  async getActiveByUserId(userId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load subscription.')
    }

    if (!data) {
      return null
    }

    const configuredPlan = await plansRepository.findByKey(data.plan_key as PlanKey)

    return {
      id: data.id as string,
      userId: data.user_id as string,
      planKey: data.plan_key as PlanKey,
      planName: configuredPlan?.name ?? PLAN_MAP[data.plan_key as PlanKey]?.name ?? (data.plan_key as string),
      status: data.status as 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired',
      creditsTotal: Number(
        data.credits_total ??
          configuredPlan?.monthlyCredits ??
          PLAN_MAP[data.plan_key as PlanKey]?.monthlyCredits ??
          0,
      ),
      creditsRemaining: Number(data.credits_remaining ?? 0),
      creditsUsed: Number(data.credits_used ?? 0),
      renewsAt: (data.renews_at as string | null) ?? null,
    }
  },

  async consumeCredits(userId: string, featureKey: FeatureKey) {
    const subscription = await this.getActiveByUserId(userId)

    if (!subscription) {
      throw new ApiError(402, 'No active subscription found for this teacher.')
    }

    const cost = FEATURE_COSTS[featureKey]
    if (subscription.creditsRemaining < cost) {
      throw new ApiError(402, 'Not enough credits remaining.')
    }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from('subscriptions')
      .update({
        credits_remaining: subscription.creditsRemaining - cost,
        credits_used: subscription.creditsUsed + cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (error) {
      throw new ApiError(500, 'Unable to deduct credits.')
    }

    return {
      ...subscription,
      creditsRemaining: subscription.creditsRemaining - cost,
      creditsUsed: subscription.creditsUsed + cost,
      creditCost: cost,
    }
  },

  async listAll() {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_key, status, credits_total, credits_remaining, credits_used, renews_at, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw new ApiError(500, 'Unable to load subscriptions.')
    }

    return data ?? []
  },

  async syncCreditsForPlan(planKey: PlanKey, monthlyCredits: number) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, credits_used')
      .eq('plan_key', planKey)
      .in('status', ['trialing', 'active', 'past_due'])

    if (error) {
      throw new ApiError(500, 'Unable to load subscriptions for credit sync.')
    }

    const rows = data ?? []
    if (rows.length === 0) {
      return
    }

    const syncedAt = new Date().toISOString()

    await Promise.all(
      rows.map(async (row: any) => {
        const creditsUsed = Number(row.credits_used ?? 0)
        const creditsRemaining = Math.max(0, monthlyCredits - creditsUsed)

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            credits_total: monthlyCredits,
            credits_remaining: creditsRemaining,
            updated_at: syncedAt,
          })
          .eq('id', row.id as string)

        if (updateError) {
          throw new ApiError(500, 'Unable to sync updated plan credits.')
        }
      }),
    )
  },
}

const FEATURE_COSTS: Record<FeatureKey, number> = {
  quiz: 1,
  lesson_plan: 2,
  writing_feedback: 2,
  speaking_questions: 1,
  pdf_export: 3,
}
