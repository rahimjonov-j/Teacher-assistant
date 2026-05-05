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
    teacherName?: string | null
  }) {
    const client = getOpenAiClient()
    const model = this.resolveModel(input.featureKey)
    const feature = FEATURE_MAP[input.featureKey]

    const response = await client.responses.create({
      model,
      temperature: 0.7,
      instructions: [
        'You are an expert AI teaching assistant helping classroom teachers.',
        input.featureKey === 'speaking_questions'
          ? 'All speaking questions and student-facing prompts must always be written in English, even if the teacher writes the request in Uzbek or another language.'
          : 'Primary language: Uzbek (Latin), unless the teacher explicitly asks for another language.',
        'Return only the requested teaching material. Do not add greetings, introductions, explanations about what you did, disclaimers, or closing notes.',
        'Follow the selected feature exactly. If the teacher asks for a test, output the test itself and nothing outside the test format.',
        'Use clean classroom-ready structure. Do not use markdown heading markers such as #, ##, or ###.',
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
                `Teacher: ${input.teacherName ?? 'Not specified'}`,
                `Additional instructions: ${input.additionalInstructions ?? 'None'}`,
                promptTemplate(input.featureKey),
              ].join('\n\n'),
            },
          ],
        },
      ],
    })

    const output = normalizeGeneratedOutput(input.featureKey, response.output_text?.trim() ?? '')

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
        'Each question must have one clear stem and 4 options when possible. Exactly one option should be correct unless the teacher explicitly asks for multiple correct answers.',
        'Distractors must be plausible, similar in length and style, and based on common learner mistakes. Avoid clues such as the correct answer being much longer than the distractors.',
        'Avoid "all of the above", "none of the above", trick wording, ambiguity, and repeated wording from the stem in the options.',
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
        'All student-facing speaking prompts must always be written in English, even if the teacher request is Uzbek or another language.',
        'The title and description must also be in English.',
        'Return only valid JSON. Do not wrap it in markdown. Do not add comments.',
        'The JSON shape must be: {"title": string, "description": string|null, "prompts": string[]}.',
        'Create 3-6 speaking prompts unless the teacher asks for another count.',
        'Use natural exam-style English questions that encourage extended spoken answers, not one-word answers.',
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

function normalizeGeneratedOutput(featureKey: FeatureKey, output: string) {
  const withoutMarkdownHeadings = output
    .split('\n')
    .map((line) => line.replace(/^#{1,6}\s+/, '').trimEnd())
    .join('\n')
    .trim()

  if (featureKey !== 'quiz') {
    return withoutMarkdownHeadings
  }

  return withoutMarkdownHeadings
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\bAnswers\b/g, 'Javoblar')
    .trim()
}

function promptTemplate(featureKey: FeatureKey) {
  switch (featureKey) {
    case 'quiz':
      return [
        'Generate a polished classroom test only.',
        'Do not use markdown heading markers (#, ##, ###).',
        'Use this exact premium printable structure:',
        'TEST NOMI: [clear title]',
        'FAN / MAVZU: [subject and topic]',
        'SINF / DARAJA: [level if known]',
        'YO`RIQNOMA: Har bir savol uchun bitta eng to`g`ri javobni tanlang.',
        '',
        'TEST SAVOLLARI',
        '1. [Clear question stem]',
        '   A) [plausible option]',
        '   B) [plausible option]',
        '   C) [plausible option]',
        '   D) [plausible option]',
        '',
        'Continue with 6-10 questions unless the teacher requested a different count.',
        'Question stems must be clear, direct, and free from unnecessary complexity.',
        'Options should be similar in length and grammatical form.',
        'Avoid all/none of the above, joke answers, and obvious distractors.',
        '',
        'JAVOBLAR KALITI',
        '1. A',
        '2. B',
        '',
        'Do not explain the answers unless the teacher explicitly asks for explanations.',
        'Do not add any section after JAVOBLAR KALITI.',
      ].join('\n')
    case 'lesson_plan':
      return 'Generate only a structured lesson plan with objective, materials, warm-up, instruction, guided practice, independent practice, differentiation, assessment, and homework. Do not add extra commentary before or after the plan.'
    case 'writing_feedback':
      return 'Generate only supportive writing feedback with strengths, growth areas, revision suggestions, rubric-style notes, and a teacher-friendly summary. Do not add extra commentary before or after the feedback.'
    case 'speaking_questions':
      return [
        'Generate only English speaking prompts and discussion questions.',
        'All prompts must be in English.',
        'Use natural school speaking-test style questions.',
        'Include warm-up questions and deeper follow-up prompts when useful.',
        'Do not add Uzbek translations unless the teacher explicitly asks for translations.',
        'Do not add extra commentary before or after the prompts.',
      ].join(' ')
    case 'pdf_export':
      return 'Summarize the content clearly for printable export.'
  }
}
