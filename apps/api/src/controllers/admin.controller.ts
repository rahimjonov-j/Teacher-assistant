import type { Request, Response } from 'express'
import { z } from 'zod'
import { analyticsService } from '../services/analytics.service.js'
import { plansRepository } from '../repositories/plans.repository.js'
import { profilesRepository } from '../repositories/profiles.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'
import { asyncHandler } from '../utils/async-handler.js'

const updatePlanSchema = z.object({
  name: z.string().trim().min(2).max(120),
  monthlyCredits: z.coerce.number().int().min(0).max(100000),
  priceMonthlyUsd: z.coerce.number().min(0).max(100000),
  description: z.string().trim().min(4).max(600),
})

const planKeySchema = z.enum(['free_trial', 'basic', 'pro', 'premium'])

export const adminController = {
  overview: asyncHandler(async (_request: Request, response: Response) => {
    const overview = await analyticsService.getAdminOverview()
    response.json(overview)
  }),

  teachers: asyncHandler(async (_request: Request, response: Response) => {
    const teachers = await analyticsService.getTeacherAnalytics()
    response.json({ teachers })
  }),

  usage: asyncHandler(async (_request: Request, response: Response) => {
    const rows = await usageRepository.listAll()
    response.json({ rows })
  }),

  subscriptions: asyncHandler(async (_request: Request, response: Response) => {
    const [subscriptions, profiles] = await Promise.all([
      subscriptionsRepository.listAll(),
      profilesRepository.listTeachers(),
    ])

    type SubscriptionProfile = {
      fullName: string | null
      email: string
    }

    const teacherProfiles = profiles as Array<{ id: string; fullName: string | null; email: string }>

    const profileByUserId = new Map<string, SubscriptionProfile>(
      teacherProfiles.map((profile): [string, SubscriptionProfile] => [
        profile.id,
        {
          fullName: profile.fullName,
          email: profile.email,
        },
      ]),
    )

    const subscriptionsWithUser = subscriptions.map((subscription: any) => {
      const profile = profileByUserId.get(subscription.user_id as string)
      return {
        ...subscription,
        user_full_name: profile?.fullName ?? null,
        user_email: profile?.email ?? null,
      }
    })
    response.json({ subscriptions: subscriptionsWithUser })
  }),

  plans: asyncHandler(async (_request: Request, response: Response) => {
    const plans = await plansRepository.listAll()
    response.json({ plans })
  }),

  updatePlan: asyncHandler(async (request: Request, response: Response) => {
    const planKey = planKeySchema.parse(request.params.key)
    const payload = updatePlanSchema.parse(request.body)
    const plan = await plansRepository.updateByKey(planKey, payload)
    await subscriptionsRepository.syncCreditsForPlan(planKey, payload.monthlyCredits)
    response.json({ plan })
  }),

  activity: asyncHandler(async (_request: Request, response: Response) => {
    const activity = await usageRepository.listRecent(30)
    response.json({ activity })
  }),
}
