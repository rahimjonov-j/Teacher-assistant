import type { Request, Response } from 'express'
import { env, hasOpenAiConfig, hasSupabaseConfig, hasTelegramConfig } from '../config/env.js'

export const healthController = {
  getStatus(_request: Request, response: Response) {
    response.json({
      status: 'ok',
      environment: env.NODE_ENV,
      services: {
        supabase: hasSupabaseConfig,
        openai: hasOpenAiConfig,
        telegram: hasTelegramConfig,
      },
    })
  },
}
