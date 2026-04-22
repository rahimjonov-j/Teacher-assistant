import { FEATURE_MAP, type GeneratorRequest, type GeneratorResponse } from '@teacher-assistant/shared'
import { contentRepository } from '../repositories/content.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'
import { openAiService } from './openai.service.js'

export const generationService = {
  async generateForTeacher(input: {
    userId: string
    source: 'web' | 'telegram'
    payload: GeneratorRequest
  }): Promise<GeneratorResponse> {
    const feature = FEATURE_MAP[input.payload.featureKey]
    const generation = await openAiService.generate({
      featureKey: input.payload.featureKey,
      topic: input.payload.topic,
      gradeOrLevel: input.payload.gradeOrLevel,
      additionalInstructions: input.payload.additionalInstructions,
    })

    const updatedSubscription = await subscriptionsRepository.consumeCredits(
      input.userId,
      input.payload.featureKey,
    )

    const title = `${feature.label} - ${input.payload.topic.slice(0, 48)}`
    const content = await contentRepository.create({
      userId: input.userId,
      title,
      featureKey: input.payload.featureKey,
      prompt: input.payload.topic,
      outputMarkdown: generation.output,
      level: input.payload.gradeOrLevel ?? null,
      additionalInstructions: input.payload.additionalInstructions ?? null,
      modelName: generation.model,
      creditsConsumed: updatedSubscription.creditCost,
      source: input.source,
    })

    await usageRepository.create({
      userId: input.userId,
      featureKey: input.payload.featureKey,
      creditsConsumed: updatedSubscription.creditCost,
      modelName: generation.model,
      source: input.source,
      generatedContentId: content.id,
      metadata: {
        title: content.title,
        level: content.level,
        inputTokens: generation.usage.inputTokens,
        outputTokens: generation.usage.outputTokens,
        totalTokens: generation.usage.totalTokens,
      },
    })

    return {
      content,
      subscription: {
        planKey: updatedSubscription.planKey,
        planName: updatedSubscription.planName,
        status: updatedSubscription.status,
        creditsTotal: updatedSubscription.creditsTotal,
        creditsRemaining: updatedSubscription.creditsRemaining,
        creditsUsed: updatedSubscription.creditsUsed,
        renewsAt: updatedSubscription.renewsAt,
      },
    }
  },
}
