import { contentRepository } from '../repositories/content.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'
import { openAiService } from './openai.service.js'

export const assignmentAiService = {
  async generateQuizForClass(input: {
    teacherId: string
    prompt: string
    className?: string | null
    groupName?: string | null
    gradeLevel?: string | null
  }) {
    const generation = await openAiService.generateQuizAssignment({
      prompt: input.prompt,
      className: input.className,
      groupName: input.groupName,
      gradeLevel: input.gradeLevel,
    })
    const updatedSubscription = await subscriptionsRepository.consumeCredits(input.teacherId, 'quiz')
    const outputMarkdown = toMarkdown(generation.quiz)

    const content = await contentRepository.create({
      userId: input.teacherId,
      title: `Sinf testi - ${generation.quiz.title}`,
      featureKey: 'quiz',
      prompt: input.prompt,
      outputMarkdown,
      level: input.gradeLevel ?? input.groupName ?? null,
      additionalInstructions: 'Generated for class assignment delivery.',
      modelName: generation.model,
      creditsConsumed: updatedSubscription.creditCost,
      source: 'web',
    })

    await usageRepository.create({
      userId: input.teacherId,
      featureKey: 'quiz',
      creditsConsumed: updatedSubscription.creditCost,
      modelName: generation.model,
      source: 'web',
      generatedContentId: content.id,
      metadata: {
        title: generation.quiz.title,
        className: input.className,
        groupName: input.groupName,
        inputTokens: generation.usage.inputTokens,
        outputTokens: generation.usage.outputTokens,
        totalTokens: generation.usage.totalTokens,
      },
    })

    return generation.quiz
  },
}

function toMarkdown(quiz: {
  title: string
  description: string | null
  questions: Array<{
    questionText: string
    options: Array<{ optionText: string; isCorrect: boolean }>
  }>
}) {
  const lines = [`# ${quiz.title}`]

  if (quiz.description) {
    lines.push('', quiz.description)
  }

  lines.push('', '## Test')

  quiz.questions.forEach((question, questionIndex) => {
    lines.push(`${questionIndex + 1}. ${question.questionText}`)
    question.options.forEach((option, optionIndex) => {
      lines.push(`   ${String.fromCharCode(65 + optionIndex)}) ${option.optionText}`)
    })
  })

  lines.push('', '## Javoblar')
  quiz.questions.forEach((question, questionIndex) => {
    const letters = question.options
      .map((option, optionIndex) => (option.isCorrect ? String.fromCharCode(65 + optionIndex) : null))
      .filter(Boolean)
      .join(', ')
    lines.push(`${questionIndex + 1}. ${letters}`)
  })

  return lines.join('\n')
}
