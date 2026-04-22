import type { Request, Response } from 'express'
import { analyticsService } from '../services/analytics.service.js'
import { profilesRepository } from '../repositories/profiles.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'
import { asyncHandler } from '../utils/async-handler.js'

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

  activity: asyncHandler(async (_request: Request, response: Response) => {
    const activity = await usageRepository.listRecent(30)
    response.json({ activity })
  }),
}
