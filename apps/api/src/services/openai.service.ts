import { DEFAULT_MODEL_STRATEGY, FEATURE_MAP, type FeatureKey } from '@teacher-assistant/shared'
import { env } from '../config/env.js'
import { getOpenAiClient } from '../config/openai.js'
import { ApiError } from '../utils/api-error.js'

export interface GeneratedQuizAssignment {
  title: string
  description: string | null
  questions: Array<{
    questionText: string
    options: Array<{
      optionText: string
      isCorrect: boolean
    }>
  }>
}

export interface GeneratedSpeakingAssignment {
  title: string
  description: string | null
  prompts: string[]
}

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

  async generateQuizAssignment(input: {
    prompt: string
    className?: string | null
    groupName?: string | null
    gradeLevel?: string | null
  }) {
    const client = getOpenAiClient()
    const model = env.OPENAI_MODEL_LIGHT

    const response = await client.responses.create({
      model,
      temperature: 0.35,
      instructions: [
        'You are an expert classroom test designer for school teachers.',
        'Primary language: Uzbek (Latin), unless the teacher explicitly requests another language.',
        'Return only valid JSON. Do not wrap it in markdown. Do not add comments.',
        'The JSON shape must be: {"title": string, "description": string|null, "questions": [{"questionText": string, "options": [{"optionText": string, "isCorrect": boolean}]}]}.',
        'Create 6-10 multiple choice questions unless the teacher asks for another count.',
        'Each question must have 3-5 options. At least one option must be correct. Prefer one correct answer unless the prompt asks for multiple correct answers.',
        'Do not include answer letters like A), B) inside optionText.',
      ].join(' '),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                `Class: ${input.className ?? 'Not specified'}`,
                `Group: ${input.groupName ?? 'Not specified'}`,
                `Grade level: ${input.gradeLevel ?? 'Not specified'}`,
                `Teacher prompt: ${input.prompt}`,
              ].join('\n'),
            },
          ],
        },
      ],
    })

    const output = response.output_text?.trim()

    if (!output) {
      throw new ApiError(502, 'OpenAI returned an empty quiz.')
    }

    return {
      model,
      quiz: parseGeneratedQuiz(output),
      usage: extractTokenUsage(response),
    }
  },

  async generateSpeakingAssignment(input: {
    prompt: string
    className?: string | null
    groupName?: string | null
    gradeLevel?: string | null
  }) {
    const client = getOpenAiClient()
    const model = env.OPENAI_MODEL_LIGHT

    const response = await client.responses.create({
      model,
      temperature: 0.45,
      instructions: [
        'You are an expert speaking exam designer for school teachers.',
        'Primary language: Uzbek (Latin), unless the teacher explicitly requests another language.',
        'Return only valid JSON. Do not wrap it in markdown. Do not add comments.',
        'The JSON shape must be: {"title": string, "description": string|null, "prompts": string[]}.',
        'Create 3-6 speaking prompts unless the teacher asks for another count.',
        'Do not create multiple choice options. These prompts are for students to answer by recording audio.',
      ].join(' '),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                `Class: ${input.className ?? 'Not specified'}`,
                `Group: ${input.groupName ?? 'Not specified'}`,
                `Grade level: ${input.gradeLevel ?? 'Not specified'}`,
                `Teacher prompt: ${input.prompt}`,
              ].join('\n'),
            },
          ],
        },
      ],
    })

    const output = response.output_text?.trim()

    if (!output) {
      throw new ApiError(502, 'OpenAI returned an empty speaking assignment.')
    }

    return {
      model,
      speaking: parseGeneratedSpeaking(output),
      usage: extractTokenUsage(response),
    }
  },
}

function parseGeneratedSpeaking(output: string): GeneratedSpeakingAssignment {
  let parsed: unknown

  try {
    parsed = JSON.parse(output)
  } catch {
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new ApiError(502, 'OpenAI returned a speaking format that could not be parsed.')
    }
    parsed = JSON.parse(jsonMatch[0])
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError(502, 'OpenAI returned an invalid speaking assignment.')
  }

  const value = parsed as Record<string, unknown>
  const prompts = Array.isArray(value.prompts)
    ? value.prompts.map((prompt) => String(prompt ?? '').trim()).filter(Boolean)
    : []

  if (prompts.length === 0) {
    throw new ApiError(502, 'OpenAI did not return usable speaking prompts.')
  }

  return {
    title: String(value.title ?? 'Speaking assignment').trim().slice(0, 180) || 'Speaking assignment',
    description: typeof value.description === 'string' && value.description.trim() ? value.description.trim() : null,
    prompts,
  }
}

function parseGeneratedQuiz(output: string): GeneratedQuizAssignment {
  let parsed: unknown

  try {
    parsed = JSON.parse(output)
  } catch {
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new ApiError(502, 'OpenAI returned a quiz format that could not be parsed.')
    }
    parsed = JSON.parse(jsonMatch[0])
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError(502, 'OpenAI returned an invalid quiz.')
  }

  const value = parsed as Record<string, unknown>
  const questions = Array.isArray(value.questions) ? value.questions : []
  const normalizedQuestions = questions
    .map((question) => {
      const questionValue = question as Record<string, unknown>
      const options = Array.isArray(questionValue.options) ? questionValue.options : []
      return {
        questionText: String(questionValue.questionText ?? '').trim(),
        options: options
          .map((option) => {
            const optionValue = option as Record<string, unknown>
            return {
              optionText: String(optionValue.optionText ?? '').trim(),
              isCorrect: Boolean(optionValue.isCorrect),
            }
          })
          .filter((option) => option.optionText.length > 0),
      }
    })
    .filter((question) => question.questionText.length > 0 && question.options.length >= 2)

  if (normalizedQuestions.length === 0) {
    throw new ApiError(502, 'OpenAI did not return usable quiz questions.')
  }

  for (const question of normalizedQuestions) {
    if (!question.options.some((option) => option.isCorrect)) {
      question.options[0] = { ...question.options[0], isCorrect: true }
    }
  }

  return {
    title: String(value.title ?? 'GPT test').trim().slice(0, 180) || 'GPT test',
    description: typeof value.description === 'string' && value.description.trim() ? value.description.trim() : null,
    questions: normalizedQuestions,
  }
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
