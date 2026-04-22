import { createApp } from './app.js'
import { env } from './config/env.js'
import { bootstrapTelegramBot } from './services/bot.service.js'

const app = createApp()

app.listen(env.PORT, async () => {
  console.log(`Teacher Assistant API listening on http://localhost:${env.PORT}`)

  try {
    await bootstrapTelegramBot()
  } catch (error) {
    console.error('Telegram bot bootstrap failed:', error)
  }
})
