import { DEFAULT_MODEL_STRATEGY, FEATURE_MAP, type FeatureKey } from '@teacher-assistant/shared'
import { env } from '../config/env.js'
import { getOpenAiClient } from '../config/openai.js'
import { ApiError } from '../utils/api-error.js'

export const openAiService = {
  resolveModel(featureKey: FeatureKey) {
    const tier = DEFAULT_MODEL_STRATEGY[featureKey]
    return tier === 'strong' ? env.OPENAI_MODEL_STRONG : env.OPENAI_MODEL_LIGHT
  },

  async generate(input: {
    featureKey: FeatureKey
    topic: string
    gradeOrLevel?: string
    additionalInstructions?: string
  }) {
    const client = getOpenAiClient()
    const model = this.resolveModel(input.featureKey)
    const feature = FEATURE_MAP[input.featureKey]

    const response = await client.responses.create({
      model,
      temperature: 0.7,
      instructions: [
        'You are an expert AI teaching assistant helping classroom teachers.',
        'Return polished markdown with clear headings, bullet points, and classroom-ready structure.',
        'Keep the output practical, professional, and easy to scan on mobile.',
      ].join(' '),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                `Feature: ${feature.label}`,
                `Topic/Input: ${input.topic}`,
                `Level: ${input.gradeOrLevel ?? 'Not specified'}`,
                `Additional instructions: ${input.additionalInstructions ?? 'None'}`,
                promptTemplate(input.featureKey),
              ].join('\n\n'),
            },
          ],
        },
      ],
    })

    const output = response.output_text?.trim()

    if (!output) {
      throw new ApiError(502, 'OpenAI returned an empty response.')
    }

    return {
      model,
      output,
      usage: extractTokenUsage(response),
    }
  },

  async generateTelegramReply(input: {
    message: string
    teacherName?: string | null
  }) {
    const client = getOpenAiClient()
    const model = env.OPENAI_MODEL_LIGHT

    const response = await client.responses.create({
      model,
      temperature: 0.6,
      max_output_tokens: 700,
      instructions: [
        "You are Teacher Assistant's Telegram AI helper for school teachers.",
        'Primary language: Uzbek (Latin).',
        'Be practical, concise, and classroom-focused.',
        "If the request is unclear, ask one short clarifying question instead of guessing.",
        'Use short markdown sections when useful.',
      ].join(' '),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                `Teacher name: ${input.teacherName ?? 'Unknown'}`,
                'Context: Telegram chat request.',
                `Request: ${input.message}`,
              ].join('\n'),
            },
          ],
        },
      ],
    })

    const output = response.output_text?.trim()

    if (!output) {
      throw new ApiError(502, 'OpenAI returned an empty Telegram reply.')
    }

    return {
      model,
      output,
      usage: extractTokenUsage(response),
    }
  },
}

function extractTokenUsage(response: unknown) {
  if (!response || typeof response !== 'object') {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    }
  }

  const usage = 'usage' in response && response.usage && typeof response.usage === 'object'
    ? (response.usage as Record<string, unknown>)
    : null

  return {
    inputTokens: Number(usage?.input_tokens ?? 0),
    outputTokens: Number(usage?.output_tokens ?? 0),
    totalTokens: Number(usage?.total_tokens ?? 0),
  }
}

function promptTemplate(featureKey: FeatureKey) {
  switch (featureKey) {
    case 'quiz':
      return 'Generate a concise classroom quiz with title, objective, 6-10 questions, answer key, and one extension activity.'
    case 'lesson_plan':
      return 'Generate a structured lesson plan with objective, materials, warm-up, instruction, guided practice, independent practice, differentiation, assessment, and homework.'
    case 'writing_feedback':
      return 'Generate supportive writing feedback with strengths, growth areas, revision suggestions, rubric-style notes, and a teacher-friendly summary.'
    case 'speaking_questions':
      return 'Generate speaking and discussion prompts with warm-up questions, deeper prompts, pair/group activity ideas, and language support when relevant.'
    case 'pdf_export':
      return 'Summarize the content clearly for printable export.'
  }
}
