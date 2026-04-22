import { FEATURE_MAP, type FeatureKey } from '@teacher-assistant/shared'
import { Telegraf } from 'telegraf'
import { env, hasOpenAiConfig, hasTelegramConfig } from '../config/env.js'
import { plansRepository } from '../repositories/plans.repository.js'
import { dashboardService } from './dashboard.service.js'
import { generationService } from './generation.service.js'
import { openAiService } from './openai.service.js'
import { telegramRepository } from '../repositories/telegram.repository.js'

let bot: Telegraf | null = null
const TELEGRAM_TEXT_LIMIT = 3800
const uzsFormatter = new Intl.NumberFormat('uz-UZ', {
  style: 'currency',
  currency: 'UZS',
  maximumFractionDigits: 0,
})
const TELEGRAM_COMMANDS = [
  { command: 'help', description: "Komandalar ro'yxati" },
  { command: 'plans', description: "Tariflar va kreditlar" },
  { command: 'balance', description: 'Joriy kredit balansi' },
  { command: 'quiz', description: 'Mavzu bo‘yicha test yaratish' },
  { command: 'lesson', description: 'Dars rejasi yaratish' },
  { command: 'feedback', description: 'Yozma ish feedbacki' },
  { command: 'speaking', description: 'Gapirish savollari' },
  { command: 'gpt', description: "Erkin savol-javob (GPT)" },
] as const

export function getTelegramBot() {
  if (!hasTelegramConfig) {
    return null
  }

  if (!bot) {
    bot = new Telegraf(env.TELEGRAM_BOT_TOKEN!)
    registerHandlers(bot)
  }

  return bot
}

export async function bootstrapTelegramBot() {
  const instance = getTelegramBot()
  if (!instance) {
    return
  }

  await instance.telegram.setMyCommands(TELEGRAM_COMMANDS)

  if (env.TELEGRAM_WEBHOOK_URL) {
    const webhookUrl = resolveWebhookUrl(env.TELEGRAM_WEBHOOK_URL)
    await instance.telegram.setWebhook(webhookUrl)
    console.log(`Telegram webhook configured: ${webhookUrl}`)
    return
  }

  await instance.launch({ dropPendingUpdates: true })
  console.log('Telegram bot launched in long-polling mode')
}

function registerHandlers(instance: Telegraf) {
  instance.catch((error) => {
    console.error('Telegram update failed:', error)
  })

  instance.start(async (context) => {
    const payload = context.payload?.trim()

    if (payload) {
      try {
        await telegramRepository.consumeLinkCode(payload, {
          id: context.from.id,
          username: context.from.username,
        })
        await context.reply(
          "Telegram akkauntingiz muvaffaqiyatli ulandi.\n\nIshlatish uchun:\n/help\n/balance\n/quiz mavzu\n/lesson mavzu\n/feedback matn\n/speaking mavzu\n/gpt savol",
        )
        return
      } catch (error) {
        await context.reply(
          error instanceof Error ? error.message : "Hozircha akkauntni ulab bo'lmadi. Qayta urinib ko'ring.",
        )
        return
      }
    }

    await context.reply(startMessage())
  })

  instance.command('menu', async (context) => {
    await context.reply(helpMessage())
  })

  instance.command('help', async (context) => {
    await context.reply(helpMessage())
  })

  instance.command('link', async (context) => {
    await context.reply(linkingHelpMessage())
  })

  instance.command('plans', async (context) => {
    try {
      const plans = await plansRepository.listAll()
      const lines = plans.map(
        (plan) => `${plan.name}: ${plan.monthlyCredits} token / ${uzsFormatter.format(plan.priceMonthlyUzs)}`,
      )
      await context.reply(lines.join('\n'))
    } catch {
      await context.reply("Tariflar ro'yxatini olishda xatolik bo'ldi.")
    }
  })

  instance.command('balance', async (context) => {
    const linkedUser = await telegramRepository.findByTelegramUserId(context.from.id)
    if (!linkedUser) {
      await context.reply(linkingHelpMessage())
      return
    }

    const dashboard = await dashboardService.getTeacherDashboard(linkedUser.userId)
    await context.reply(
      `Tarif: ${dashboard.subscription?.planName ?? "Faol tarif yo'q"}\nQolgan kredit: ${
        dashboard.subscription?.creditsRemaining ?? 0
      } / ${dashboard.subscription?.creditsTotal ?? 0}`,
    )
  })

  instance.command('gpt', async (context) => {
    const linkedUser = await telegramRepository.findByTelegramUserId(context.from.id)
    if (!linkedUser) {
      await context.reply(linkingHelpMessage())
      return
    }

    if (!hasOpenAiConfig) {
      await context.reply("OpenAI hali sozlanmagan. .env faylda OPENAI_API_KEY ni tekshiring.")
      return
    }

    const prompt = extractCommandArgument(context.message.text, 'gpt')
    if (!prompt) {
      await context.reply("Misol: /gpt 7-sinflar uchun kasr mavzusini sodda tushuntirib ber")
      return
    }

    try {
      await context.sendChatAction('typing')
      const answer = await openAiService.generateTelegramReply({
        message: prompt,
        teacherName: context.from.first_name ?? null,
      })
      await context.reply(trimTelegramText(answer.output))
    } catch (error) {
      await context.reply(
        error instanceof Error ? error.message : "GPT javobini olishda xatolik bo'ldi.",
      )
    }
  })

  registerQuickAction(instance, 'quiz', 'quiz')
  registerQuickAction(instance, 'lesson', 'lesson_plan')
  registerQuickAction(instance, 'feedback', 'writing_feedback')
  registerQuickAction(instance, 'speaking', 'speaking_questions')

  instance.on('text', async (context) => {
    const text = context.message.text.trim()
    if (!text || text.startsWith('/')) {
      return
    }

    const normalized = text.toLowerCase()

    if (isGreeting(normalized)) {
      await context.reply(
        "Salom. Men Teacher Assistant botiman.\nMenyu uchun /help yuboring yoki to'g'ridan-to'g'ri /gpt savol deb yozing.",
      )
      return
    }

    if (normalized.startsWith('test ') || normalized.startsWith('quiz ')) {
      await runQuickGeneration({
        telegramUserId: context.from.id,
        commandHint: '/quiz',
        featureKey: 'quiz',
        text: text.split(/\s+/).slice(1).join(' '),
        reply: (value) => context.reply(value),
      })
      return
    }

    if (normalized.startsWith('dars ') || normalized.startsWith('lesson ')) {
      await runQuickGeneration({
        telegramUserId: context.from.id,
        commandHint: '/lesson',
        featureKey: 'lesson_plan',
        text: text.split(/\s+/).slice(1).join(' '),
        reply: (value) => context.reply(value),
      })
      return
    }

    if (normalized.startsWith('feedback ') || normalized.startsWith('fikr ')) {
      await runQuickGeneration({
        telegramUserId: context.from.id,
        commandHint: '/feedback',
        featureKey: 'writing_feedback',
        text: text.split(/\s+/).slice(1).join(' '),
        reply: (value) => context.reply(value),
      })
      return
    }

    if (normalized.startsWith('speaking ') || normalized.startsWith('gapirish ')) {
      await runQuickGeneration({
        telegramUserId: context.from.id,
        commandHint: '/speaking',
        featureKey: 'speaking_questions',
        text: text.split(/\s+/).slice(1).join(' '),
        reply: (value) => context.reply(value),
      })
      return
    }

    const linkedUser = await telegramRepository.findByTelegramUserId(context.from.id)
    if (!linkedUser) {
      await context.reply(linkingHelpMessage())
      return
    }

    if (!hasOpenAiConfig) {
      await context.reply("Savol yuborildi, lekin OpenAI yoqilmagan. /help bilan komandalarni ishlating.")
      return
    }

    try {
      await context.sendChatAction('typing')
      const answer = await openAiService.generateTelegramReply({
        message: text,
        teacherName: context.from.first_name ?? null,
      })
      await context.reply(trimTelegramText(answer.output))
    } catch (error) {
      await context.reply(
        error instanceof Error ? error.message : "Hozircha javob bera olmadim. Keyinroq qayta urinib ko'ring.",
      )
    }
  })
}

function registerQuickAction(instance: Telegraf, command: string, featureKey: FeatureKey) {
  instance.command(command, async (context) => {
    const text = extractCommandArgument(context.message.text, command)

    await runQuickGeneration({
      telegramUserId: context.from.id,
      commandHint: `/${command}`,
      featureKey,
      text,
      reply: (value) => context.reply(value),
    })
  })
}

async function runQuickGeneration(input: {
  telegramUserId: number
  commandHint: string
  featureKey: FeatureKey
  text: string
  reply: (value: string) => Promise<unknown>
}) {
  const linkedUser = await telegramRepository.findByTelegramUserId(input.telegramUserId)

  if (!linkedUser) {
    await input.reply(linkingHelpMessage())
    return
  }

  if (!input.text) {
    await input.reply(`Mavzu kiriting. Misol: ${input.commandHint} Algebra bo'yicha 10 ta savol`)
    return
  }

  try {
    const result = await generationService.generateForTeacher({
      userId: linkedUser.userId,
      source: 'telegram',
      payload: {
        featureKey: input.featureKey,
        topic: input.text,
      },
    })

    await input.reply(
      `${FEATURE_MAP[input.featureKey].label}\n\n${trimTelegramText(
        result.content.outputMarkdown,
      )}\n\nQolgan kredit: ${result.subscription?.creditsRemaining ?? 0}`,
    )
  } catch (error) {
    await input.reply(
      error instanceof Error ? error.message : "Kontent yaratishda xatolik bo'ldi. Qayta urinib ko'ring.",
    )
  }
}

function trimTelegramText(value: string) {
  if (value.length <= TELEGRAM_TEXT_LIMIT) {
    return value
  }

  return `${value.slice(0, TELEGRAM_TEXT_LIMIT - 40)}\n\n...[matn qisqartirildi]`
}

function extractCommandArgument(text: string, command: string) {
  const words = text.trim().split(/\s+/)
  const commandToken = words[0]?.toLowerCase() ?? ''
  const expectedPrefix = `/${command.toLowerCase()}`
  if (!commandToken.startsWith(expectedPrefix)) {
    return ''
  }

  return words.slice(1).join(' ').trim()
}

function startMessage() {
  return [
    "Teacher Assistant botiga xush kelibsiz.",
    '',
    "1) Web ilovadagi Sozlamalar bo'limidan link code oling.",
    '2) Botga /start CODE yuboring.',
    "3) Keyin quyidagi komandalarni ishlating:",
    '/help',
    '/quiz mavzu',
    '/lesson mavzu',
    '/feedback matn',
    '/speaking mavzu',
    '/gpt savol',
  ].join('\n')
}

function helpMessage() {
  return [
    "Asosiy komandalar:",
    '/plans - tariflar',
    '/balance - qolgan kreditlar',
    '/quiz mavzu - test',
    '/lesson mavzu - dars rejasi',
    "/feedback matn - yozma ish bo'yicha fikr",
    '/speaking mavzu - gapirish savollari',
    '/gpt savol - GPT bilan erkin savol-javob',
    '',
    "Masalan: /gpt 9-sinf uchun energiya mavzusini sodda tushuntir",
  ].join('\n')
}

function linkingHelpMessage() {
  const quickLink = env.TELEGRAM_BOT_USERNAME
    ? `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=YOUR_LINK_CODE`
    : null

  const lines = [
    "Telegram hali ulanmagan.",
    "Web ilovadagi Sozlamalar > Telegram bo'limidan link code oling.",
    "So'ng botga /start CODE yuboring.",
  ]

  if (quickLink) {
    lines.push(`Tezkor havola namunasi: ${quickLink}`)
  }

  return lines.join('\n')
}

function isGreeting(text: string) {
  return /^(salom|assalomu alaykum|hello|hi)\b/i.test(text)
}

function resolveWebhookUrl(rawUrl: string) {
  const parsed = new URL(rawUrl)
  if (parsed.pathname.includes('/api/telegram/webhook')) {
    return parsed.toString()
  }

  return new URL('/api/telegram/webhook', parsed).toString()
}
