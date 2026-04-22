import { FEATURE_DEFINITIONS, type TeacherDashboardPayload } from '@teacher-assistant/shared'
import { contentRepository } from '../repositories/content.repository.js'
import { profilesRepository } from '../repositories/profiles.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'

export const dashboardService = {
  async getTeacherDashboard(userId: string): Promise<TeacherDashboardPayload> {
    const [profile, subscription, recentContent, usageRows] = await Promise.all([
      profilesRepository.getById(userId),
      subscriptionsRepository.getActiveByUserId(userId),
      contentRepository.listByUserId(userId),
      usageRepository.listAll(),
    ])

    const userUsage = usageRows.filter((row) => row.userId === userId)
    const featureCounts = new Map<string, number>()

    for (const row of userUsage) {
      const key = row.featureKey as string
      featureCounts.set(key, (featureCounts.get(key) ?? 0) + 1)
    }

    const mostUsedFeature =
      [...featureCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null

    return {
      profile,
      subscription: subscription
        ? {
            planKey: subscription.planKey,
            planName: subscription.planName,
            status: subscription.status,
            creditsTotal: subscription.creditsTotal,
            creditsRemaining: subscription.creditsRemaining,
            creditsUsed: subscription.creditsUsed,
            renewsAt: subscription.renewsAt,
          }
        : null,
      quickActions: FEATURE_DEFINITIONS.filter((feature) => feature.key !== 'pdf_export'),
      recentContent: recentContent.slice(0, 5),
      usageSummary: {
        totalRequestsThisMonth: userUsage.length,
        mostUsedFeature: mostUsedFeature as TeacherDashboardPayload['usageSummary']['mostUsedFeature'],
        creditsRemaining: subscription?.creditsRemaining ?? 0,
      },
    }
  },
}
