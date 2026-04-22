import type { AdminOverviewPayload, FeatureKey } from '@teacher-assistant/shared'
import { profilesRepository } from '../repositories/profiles.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'

export const analyticsService = {
  async getAdminOverview(): Promise<AdminOverviewPayload> {
    const [teachers, usageRows, subscriptions, recentActivity] = await Promise.all([
      profilesRepository.listTeachers(),
      usageRepository.listAll(),
      subscriptionsRepository.listAll(),
      usageRepository.listRecent(10),
    ])

    const activeSubscriptions = subscriptions.filter((subscription: any) =>
      ['trialing', 'active', 'past_due'].includes(subscription.status as string),
    ).length

    const featureTotals = new Map<
      FeatureKey,
      {
        totalRequests: number
        creditsConsumed: number
        totalTokens: number
      }
    >()
    const teacherTotals = new Map<
      string,
      {
        totalRequests: number
        creditsConsumed: number
        totalTokens: number
      }
    >()
    const usageTrend = new Map<
      string,
      {
        totalRequests: number
        creditsConsumed: number
        totalTokens: number
      }
    >()

    for (const row of usageRows) {
      const featureKey = row.featureKey as FeatureKey
      const credits = Number(row.creditsConsumed ?? 0)
      const totalTokens = Number(row.totalTokens ?? 0)
      const createdAt = new Date(row.createdAt)
      const period = createdAt.toISOString().slice(0, 10)

      const featureEntry = featureTotals.get(featureKey) ?? {
        totalRequests: 0,
        creditsConsumed: 0,
        totalTokens: 0,
      }
      featureEntry.totalRequests += 1
      featureEntry.creditsConsumed += credits
      featureEntry.totalTokens += totalTokens
      featureTotals.set(featureKey, featureEntry)

      const teacherEntry = teacherTotals.get(row.userId) ?? {
        totalRequests: 0,
        creditsConsumed: 0,
        totalTokens: 0,
      }
      teacherEntry.totalRequests += 1
      teacherEntry.creditsConsumed += credits
      teacherEntry.totalTokens += totalTokens
      teacherTotals.set(row.userId, teacherEntry)

      const trendEntry = usageTrend.get(period) ?? {
        totalRequests: 0,
        creditsConsumed: 0,
        totalTokens: 0,
      }
      trendEntry.totalRequests += 1
      trendEntry.creditsConsumed += credits
      trendEntry.totalTokens += totalTokens
      usageTrend.set(period, trendEntry)
    }

    const totalTokens = usageRows.reduce((sum, row) => sum + Number(row.totalTokens ?? 0), 0)
    const mostUsedFeature =
      [...featureTotals.entries()].sort(
        (
          left: [FeatureKey, { totalRequests: number }],
          right: [FeatureKey, { totalRequests: number }],
        ) => right[1].totalRequests - left[1].totalRequests,
      )[0]?.[0] ??
      null

    return {
      kpis: [
        { label: 'Foydalanuvchilar', value: teachers.length },
        { label: "Jami so'rovlar", value: usageRows.length },
        { label: 'Jami tokenlar', value: totalTokens.toLocaleString('en-US') },
        { label: 'Faol obunalar', value: activeSubscriptions },
      ],
      topTeachers: teachers
        .map((teacher: any) => {
          const totals = teacherTotals.get(teacher.id) ?? {
            totalRequests: 0,
            creditsConsumed: 0,
            totalTokens: 0,
          }
          return {
            userId: teacher.id,
            fullName: teacher.fullName,
            email: teacher.email,
            totalRequests: totals.totalRequests,
            creditsConsumed: totals.creditsConsumed,
            totalTokens: totals.totalTokens,
          }
        })
        .sort(
          (
            left: { totalRequests: number },
            right: { totalRequests: number },
          ) => right.totalRequests - left.totalRequests,
        )
        .slice(0, 5),
      featureUsage: [...featureTotals.entries()]
        .map(([featureKey, stats]) => ({
          featureKey,
          totalRequests: stats.totalRequests,
          creditsConsumed: stats.creditsConsumed,
          totalTokens: stats.totalTokens,
        }))
        .sort(
          (
            left: { totalRequests: number },
            right: { totalRequests: number },
          ) => right.totalRequests - left.totalRequests,
        ),
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        teacherName: activity.teacherName,
        featureKey: activity.featureKey,
        creditsConsumed: activity.creditsConsumed,
        totalTokens: activity.totalTokens,
        createdAt: activity.createdAt,
      })),
      usageTrend: [...usageTrend.entries()]
        .map(([period, stats]) => ({
          period,
          totalRequests: stats.totalRequests,
          creditsConsumed: stats.creditsConsumed,
          totalTokens: stats.totalTokens,
        }))
        .sort(
          (
            left: { period: string },
            right: { period: string },
          ) => left.period.localeCompare(right.period),
        )
        .slice(-14),
    }
  },

  async getTeacherAnalytics() {
    const [teachers, usageRows, subscriptions] = await Promise.all([
      profilesRepository.listTeachers(),
      usageRepository.listAll(),
      subscriptionsRepository.listAll(),
    ])

    const teacherTotals = new Map<
      string,
      {
        totalRequests: number
        creditsConsumed: number
        totalTokens: number
        lastActiveAt: string | null
      }
    >()

    for (const row of usageRows) {
      const current = teacherTotals.get(row.userId) ?? {
        totalRequests: 0,
        creditsConsumed: 0,
        totalTokens: 0,
        lastActiveAt: null,
      }

      current.totalRequests += 1
      current.creditsConsumed += Number(row.creditsConsumed ?? 0)
      current.totalTokens += Number(row.totalTokens ?? 0)
      current.lastActiveAt =
        !current.lastActiveAt || row.createdAt > current.lastActiveAt ? row.createdAt : current.lastActiveAt
      teacherTotals.set(row.userId, current)
    }

    const subscriptionsByUserId = new Map(
      subscriptions.map((subscription: any) => [
        subscription.user_id as string,
        {
          planKey: subscription.plan_key as string,
          status: subscription.status as string,
          creditsRemaining: Number(subscription.credits_remaining ?? 0),
          creditsUsed: Number(subscription.credits_used ?? 0),
        },
      ]),
    )

    return teachers
      .map((teacher: any) => {
        const totals = teacherTotals.get(teacher.id) ?? {
          totalRequests: 0,
          creditsConsumed: 0,
          totalTokens: 0,
          lastActiveAt: null,
        }
        const subscription = subscriptionsByUserId.get(teacher.id) ?? null

        return {
          id: teacher.id,
          email: teacher.email,
          fullName: teacher.fullName,
          schoolName: teacher.schoolName,
          role: teacher.role,
          createdAt: teacher.createdAt,
          totalRequests: totals.totalRequests,
          creditsConsumed: totals.creditsConsumed,
          totalTokens: totals.totalTokens,
          lastActiveAt: totals.lastActiveAt,
          subscription,
        }
      })
      .sort(
        (
          left: { totalRequests: number },
          right: { totalRequests: number },
        ) => right.totalRequests - left.totalRequests,
      )
  },
}
