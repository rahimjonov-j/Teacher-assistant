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
        'Primary language: Uzbek (Latin), unless the teacher explicitly asks for another language.',
        'Return only the requested teaching material. Do not add greetings, introductions, explanations about what you did, disclaimers, or closing notes.',
        'Follow the selected feature exactly. If the teacher asks for a test, output the test itself and nothing outside the test format.',
        'Use clean markdown with clear headings and classroom-ready structure.',
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
      return [
        'Generate a classroom test only.',
        'Required format:',
        '# [Test title]',
        '## Test',
        '1. Question text',
        '   A) Option',
        '   B) Option',
        '   C) Option',
        '   D) Option',
        'Continue with 6-10 questions unless the teacher requested a different count.',
        '## Javoblar',
        '1. A',
        '2. B',
        'List every correct answer in this final section only. Do not explain the answers. Do not add any section after Javoblar.',
      ].join('\n')
    case 'lesson_plan':
      return 'Generate only a structured lesson plan with objective, materials, warm-up, instruction, guided practice, independent practice, differentiation, assessment, and homework. Do not add extra commentary before or after the plan.'
    case 'writing_feedback':
      return 'Generate only supportive writing feedback with strengths, growth areas, revision suggestions, rubric-style notes, and a teacher-friendly summary. Do not add extra commentary before or after the feedback.'
    case 'speaking_questions':
      return 'Generate only speaking and discussion prompts with warm-up questions, deeper prompts, pair/group activity ideas, and language support when relevant. Do not add extra commentary before or after the prompts.'
    case 'pdf_export':
      return 'Summarize the content clearly for printable export.'
  }
}
