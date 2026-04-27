import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { getTelegramBot, getTelegramBotStatus } from '../services/bot.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const telegramController = {
  status: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await getTelegramBotStatus())
  }),

  webhook: asyncHandler(async (request: Request, response: Response) => {
    const bot = getTelegramBot()

    if (!bot || !env.TELEGRAM_WEBHOOK_URL) {
      response.status(404).json({ error: 'Telegram webhook is not configured.' })
      return
    }

    await bot.handleUpdate(request.body)
    response.status(200).json({ ok: true })
  }),
}
