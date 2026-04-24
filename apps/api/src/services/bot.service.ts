import {
  FEATURE_MAP,
  PLAN_MAP,
  TELEGRAM_COMMAND_DEFINITIONS,
  TELEGRAM_COMMAND_MAP,
  TELEGRAM_FEATURE_COMMAND_MAP,
  TELEGRAM_FEATURE_COMMANDS,
  TELEGRAM_MENU_COMMANDS,
  type FeatureKey,
  type PlanKey,
} from '@teacher-assistant/shared'
import { Markup, Telegraf } from 'telegraf'
import { env, hasOpenAiConfig, hasTelegramConfig } from '../config/env.js'
import { plansRepository } from '../repositories/plans.repository.js'
import { telegramRepository } from '../repositories/telegram.repository.js'
import { dashboardService } from './dashboard.service.js'
import { generationService } from './generation.service.js'
import { openAiService } from './openai.service.js'

let bot: Telegraf | null = null

const TELEGRAM_TEXT_LIMIT = 3800
const uzsFormatter = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
})

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

  await instance.telegram.setMyCommands(TELEGRAM_MENU_COMMANDS)

  const webhookUrl = getUsableWebhookUrl(env.TELEGRAM_WEBHOOK_URL)
  if (webhookUrl) {
    await instance.telegram.setWebhook(webhookUrl)
    console.log(`Telegram webhook configured: ${webhookUrl}`)
    return
  }

  await instance.telegram.deleteWebhook()
  await instance.launch({ dropPendingUpdates: true })
  console.log('Telegram bot launched in long-polling mode')
}

function registerHandlers(instance: Telegraf) {
  instance.catch((error) => {
    console.error('Telegram update failed:', error)
  })

  instance.start(async (context) => {
    const payload = parseStartPayload(context.payload?.trim())

    if (payload?.type === 'upgrade') {
      await context.reply(await upgradeMessage(payload.planKey))
      return
    }

    if (payload?.type === 'link') {
      try {
        await telegramRepository.consumeLinkCode(payload.code, {
          id: context.from.id,
          username: context.from.username,
        })

        await context.reply(
          [
            "Telegram akkauntingiz muvaffaqiyatli ulandi.",
            '',
            "Endi quyidagi komandalarni ishlatishingiz mumkin:",
            ...commandDirectoryLines(),
          ].join('\n'),
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
        (plan) => `${plan.name}: ${plan.monthlyCredits} token / ${formatUzs(plan.priceMonthlyUzs)}`,
      )
      const plansKeyboard = buildPlansKeyboard(plans)

      if (plansKeyboard) {
        await context.reply(lines.join('\n'), plansKeyboard)
        return
      }

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
      await context.reply(TELEGRAM_COMMAND_MAP.gpt?.example ?? "Misol: /gpt Savol yozing")
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

  TELEGRAM_FEATURE_COMMANDS.forEach((command) => {
    registerQuickAction(instance, command.command, command.featureKey)
  })

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

    const matchedFeatureCommand = matchFeatureCommandFromText(text)
    if (matchedFeatureCommand) {
      await runQuickGeneration({
        telegramUserId: context.from.id,
        commandHint: matchedFeatureCommand.usage,
        featureKey: matchedFeatureCommand.featureKey,
        text: matchedFeatureCommand.argument,
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
    const commandConfig = TELEGRAM_COMMAND_MAP[command]

    await runQuickGeneration({
      telegramUserId: context.from.id,
      commandHint: commandConfig?.usage ?? `/${command}`,
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
    const commandConfig = TELEGRAM_FEATURE_COMMAND_MAP[input.featureKey]
    await input.reply(`Mavzu kiriting. Misol: ${commandConfig?.example ?? input.commandHint}`)
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
    ...commandDirectoryLines(),
  ].join('\n')
}

function helpMessage() {
  return [
    "Asosiy komandalar:",
    ...TELEGRAM_COMMAND_DEFINITIONS.map((command) => `${command.usage} - ${command.description}`),
    '',
    `Masalan: ${TELEGRAM_COMMAND_MAP.gpt?.example ?? '/gpt savol'}`,
  ].join('\n')
}

function linkingHelpMessage() {
  const botLink = getTelegramBotLink()
  const quickLink = botLink ? `${botLink}?start=YOUR_LINK_CODE` : null

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

function formatUzs(value: number) {
  return `${uzsFormatter.format(value).replace(/[\u00A0\u202F]/g, ' ')} so'm`
}

function buildPlansKeyboard(
  plans: Array<{ key: PlanKey; name: string; priceMonthlyUzs: number }>,
) {
  const botLink = getTelegramBotLink()
  if (!botLink) {
    return null
  }

  const buttons = plans
    .filter((plan) => plan.key !== 'free_trial')
    .map((plan) =>
      [
        Markup.button.url(
          `${plan.name} sotib olish`,
          `${botLink}?start=upgrade_${plan.key}`,
        ),
      ],
    )

  if (buttons.length === 0) {
    return null
  }

  return Markup.inlineKeyboard(buttons)
}

function getTelegramBotLink() {
  const username = env.TELEGRAM_BOT_USERNAME?.replace(/^@+/, '').trim()
  return username ? `https://t.me/${username}` : null
}

function commandDirectoryLines() {
  return TELEGRAM_COMMAND_DEFINITIONS.map((command) => command.usage)
}

function matchFeatureCommandFromText(text: string) {
  const parts = text.trim().split(/\s+/)
  const prefix = parts[0]?.toLowerCase()

  if (!prefix) {
    return null
  }

  const matchedCommand = TELEGRAM_FEATURE_COMMANDS.find((command) =>
    command.aliases?.some((alias) => alias === prefix),
  )

  if (!matchedCommand) {
    return null
  }

  return {
    ...matchedCommand,
    argument: parts.slice(1).join(' ').trim(),
  }
}

function parseStartPayload(payload: string | undefined) {
  if (!payload) {
    return null
  }

  if (payload.startsWith('link_')) {
    const code = payload.slice('link_'.length).trim()
    return code ? { type: 'link' as const, code } : null
  }

  if (payload.startsWith('upgrade_')) {
    const planKey = payload.slice('upgrade_'.length).trim() as PlanKey
    if (planKey in PLAN_MAP) {
      return { type: 'upgrade' as const, planKey }
    }

    return null
  }

  return { type: 'link' as const, code: payload }
}

async function upgradeMessage(planKey: PlanKey) {
  const configuredPlan = await plansRepository.findByKey(planKey)
  const plan = configuredPlan ?? PLAN_MAP[planKey]

  if (!plan) {
    return "Tanlangan tarif topilmadi. /plans orqali mavjud tariflarni ko'rishingiz mumkin."
  }

  const lines = [
    `${plan.name} tarifi tanlandi.`,
    `Narx: ${formatUzs(plan.priceMonthlyUzs)} / oy`,
    `Limit: ${plan.monthlyCredits} oylik token`,
    '',
    plan.description,
  ]

  lines.push('', `Davom etish uchun billing sahifasi: ${new URL('/app/billing', env.APP_URL).toString()}`)

  return lines.join('\n')
}

function resolveWebhookUrl(rawUrl: string) {
  const parsed = new URL(rawUrl)
  if (parsed.pathname.includes('/api/telegram/webhook')) {
    return parsed.toString()
  }

  return new URL('/api/telegram/webhook', parsed).toString()
}

function getUsableWebhookUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return null
  }

  try {
    const webhookUrl = resolveWebhookUrl(rawUrl)
    const parsed = new URL(webhookUrl)
    const blockedHosts = new Set(['api', 'localhost', '127.0.0.1', '0.0.0.0'])

    if (blockedHosts.has(parsed.hostname) || parsed.hostname.endsWith('.local')) {
      console.warn(`Telegram webhook skipped because hostname is not publicly reachable: ${parsed.hostname}`)
      return null
    }

    return webhookUrl
  } catch (error) {
    console.warn('Telegram webhook skipped because URL is invalid.', error)
    return null
  }
}
