import OpenAI from 'openai'
import { env, hasOpenAiConfig } from './env.js'

let client: OpenAI | null = null

export function getOpenAiClient() {
  if (!hasOpenAiConfig) {
    throw new Error('OpenAI API key is missing.')
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }

  return client
}
