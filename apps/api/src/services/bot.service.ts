import {
  PLAN_MAP,
  TELEGRAM_FEATURE_COMMANDS,
  type FeatureKey,
  type PlanKey,
} from '@teacher-assistant/shared'
import { Markup, Telegraf } from 'telegraf'
import { env, hasTelegramConfig } from '../config/env.js'
import { plansRepository } from '../repositories/plans.repository.js'
import { telegramRepository } from '../repositories/telegram.repository.js'
import { dashboardService } from './dashboard.service.js'
import { generationService } from './generation.service.js'

let bot: Telegraf | null = null

const TELEGRAM_TEXT_LIMIT = 3800
const uzsFormatter = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
})

const TELEGRAM_MENU_COMMANDS = [
  { command: 'start', description: 'Asosiy menyu' },
  { command: 'menu', description: 'Asosiy menyu' },
]

const BOT_FEATURE_KEYS = ['quiz', 'lesson_plan', 'writing_feedback', 'speaking_questions'] as const
type BotFeatureKey = (typeof BOT_FEATURE_KEYS)[number]

type PendingAction =
  | {
      type: 'feature'
      featureKey: BotFeatureKey
    }
  | {
      type: 'link'
    }

const pendingActions = new Map<number, PendingAction>()

const featureUx: Record<
  BotFeatureKey,
  {
    button: string
    prompt: string
    repeat: string
    resultTitle: string
  }
> = {
  quiz: {
    button: '📝 Test yaratish',
    prompt: 'Qaysi mavzuda test yaratamiz? ✍️',
    repeat: '🔁 Yana test',
    resultTitle: '📝 Test tayyor',
  },
  lesson_plan: {
    button: '📚 Dars reja',
    prompt: 'Qaysi mavzuda dars reja tuzaylik? 📚',
    repeat: '🔁 Yana reja',
    resultTitle: '📚 Dars reja tayyor',
  },
  writing_feedback: {
    button: '✍️ Writing tahlil',
    prompt: 'Matn yuboring, men uni tahlil qilib beraman ✍️',
    repeat: '🔁 Yana tahlil',
    resultTitle: '✍️ Tahlil tayyor',
  },
  speaking_questions: {
    button: '🎤 Speaking savol',
    prompt: 'Qaysi mavzuda speaking savollar kerak? 🎤',
    repeat: '🔁 Yana savol',
    resultTitle: '🎤 Savollar tayyor',
  },
}

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
    pendingActions.delete(context.from.id)
    const payload = parseStartPayload(context.payload?.trim())

    if (payload?.type === 'upgrade') {
      await context.reply(await upgradeMessage(payload.planKey), mainMenuKeyboard())
      return
    }

    if (payload?.type === 'link') {
      await consumeLinkCodeFromText({
        telegramUserId: context.from.id,
        telegramUsername: context.from.username,
        code: payload.code,
        reply: (message, keyboard) => context.reply(message, keyboard),
      })
      return
    }

    await context.reply(startMessage(), mainMenuKeyboard())
  })

  instance.command('menu', async (context) => {
    pendingActions.delete(context.from.id)
    await context.reply('Asosiy menyu 👇', mainMenuKeyboard())
  })

  instance.command('help', async (context) => {
    pendingActions.delete(context.from.id)
    await context.reply(helpMessage(), settingsKeyboard())
  })

  instance.command('link', async (context) => {
    pendingActions.set(context.from.id, { type: 'link' })
    await context.reply(linkPrompt(), backKeyboard())
  })

  instance.command('plans', async (context) => {
    pendingActions.delete(context.from.id)
    try {
      const plans = await plansRepository.listAll()
      const lines = plans.map(
        (plan) => `${plan.name}: ${plan.monthlyCredits} kredit / ${formatUzs(plan.priceMonthlyUzs)}`,
      )
      const plansKeyboard = buildPlansKeyboard(plans)
      await context.reply(
        ['Tariflar 👇', '', ...lines].join('\n'),
        plansKeyboard ?? mainMenuKeyboard(),
      )
    } catch {
      await context.reply("Tariflarni hozircha ko'rsata olmadim.", mainMenuKeyboard())
    }
  })

  instance.command('balance', async (context) => {
    pendingActions.delete(context.from.id)
    const linkedUser = await telegramRepository.findByTelegramUserId(context.from.id)
    if (!linkedUser) {
      await context.reply(unlinkedMessage(), linkingKeyboard())
      return
    }

    const dashboard = await dashboardService.getTeacherDashboard(linkedUser.userId)
    await context.reply(
      [
        'Balans 👇',
        `Tarif: ${dashboard.subscription?.planName ?? "Faol tarif yo'q"}`,
        `Qolgan kredit: ${dashboard.subscription?.creditsRemaining ?? 0} / ${
          dashboard.subscription?.creditsTotal ?? 0
        }`,
      ].join('\n'),
      mainMenuKeyboard(),
    )
  })

  instance.command('gpt', async (context) => {
    pendingActions.delete(context.from.id)
    await context.reply('Kerakli bo‘limni tanlang, men davom ettiraman 👇', mainMenuKeyboard())
  })

  TELEGRAM_FEATURE_COMMANDS.forEach((command) => {
    if (isBotFeatureKey(command.featureKey)) {
      registerQuickAction(instance, command.command, command.featureKey)
    }
  })

  BOT_FEATURE_KEYS.forEach((featureKey) => {
    instance.action(`feature:${featureKey}`, async (context) => {
      await context.answerCbQuery()
      await promptForFeature(context.from.id, featureKey, (message, keyboard) =>
        context.reply(message, keyboard),
      )
    })

    instance.action(`repeat:${featureKey}`, async (context) => {
      await context.answerCbQuery()
      await promptForFeature(context.from.id, featureKey, (message, keyboard) =>
        context.reply(message, keyboard),
      )
    })
  })

  instance.action('settings', async (context) => {
    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await context.reply('Sozlamalar 👇', settingsKeyboard())
  })

  instance.action('settings:link', async (context) => {
    pendingActions.set(context.from.id, { type: 'link' })
    await context.answerCbQuery()
    await context.reply(linkPrompt(), backKeyboard())
  })

  instance.action('settings:language', async (context) => {
    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await context.reply('🌐 Bot tili: O‘zbek tili', backKeyboard())
  })

  instance.action('settings:help', async (context) => {
    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await context.reply(helpMessage(), backKeyboard())
  })

  instance.action('back', async (context) => {
    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await context.reply('Asosiy menyu 👇', mainMenuKeyboard())
  })

  instance.on('text', async (context) => {
    const text = context.message.text.trim()
    if (!text || text.startsWith('/')) {
      return
    }

    const pendingAction = pendingActions.get(context.from.id)

    if (pendingAction?.type === 'link') {
      pendingActions.delete(context.from.id)
      await consumeLinkCodeFromText({
        telegramUserId: context.from.id,
        telegramUsername: context.from.username,
        code: text,
        reply: (message, keyboard) => context.reply(message, keyboard),
      })
      return
    }

    if (pendingAction?.type === 'feature') {
      pendingActions.delete(context.from.id)
      await runFeatureGeneration({
        telegramUserId: context.from.id,
        featureKey: pendingAction.featureKey,
        text,
        sendTyping: () => context.sendChatAction('typing'),
        reply: (message, keyboard) => context.reply(message, keyboard),
      })
      return
    }

    if (isGreeting(text.toLowerCase())) {
      await context.reply('Salom! Kerakli bo‘limni tanlang 👇', mainMenuKeyboard())
      return
    }

    await context.reply('Boshlash uchun bo‘lim tanlang 👇', mainMenuKeyboard())
  })
}

function registerQuickAction(instance: Telegraf, command: string, featureKey: BotFeatureKey) {
  instance.command(command, async (context) => {
    const text = extractCommandArgument(context.message.text, command)

    if (!text) {
      await promptForFeature(context.from.id, featureKey, (message, keyboard) =>
        context.reply(message, keyboard),
      )
      return
    }

    pendingActions.delete(context.from.id)
    await runFeatureGeneration({
      telegramUserId: context.from.id,
      featureKey,
      text,
      sendTyping: () => context.sendChatAction('typing'),
      reply: (message, keyboard) => context.reply(message, keyboard),
    })
  })
}

async function promptForFeature(
  telegramUserId: number,
  featureKey: BotFeatureKey,
  reply: (message: string, keyboard?: ReturnType<typeof Markup.inlineKeyboard>) => Promise<unknown>,
) {
  const linkedUser = await telegramRepository.findByTelegramUserId(telegramUserId)
  if (!linkedUser) {
    pendingActions.delete(telegramUserId)
    await reply(unlinkedMessage(), linkingKeyboard())
    return
  }

  pendingActions.set(telegramUserId, { type: 'feature', featureKey })
  await reply(featureUx[featureKey].prompt, backKeyboard())
}

async function runFeatureGeneration(input: {
  telegramUserId: number
  featureKey: BotFeatureKey
  text: string
  sendTyping: () => Promise<unknown>
  reply: (message: string, keyboard?: ReturnType<typeof Markup.inlineKeyboard>) => Promise<unknown>
}) {
  const linkedUser = await telegramRepository.findByTelegramUserId(input.telegramUserId)

  if (!linkedUser) {
    await input.reply(unlinkedMessage(), linkingKeyboard())
    return
  }

  if (!input.text.trim()) {
    await promptForFeature(input.telegramUserId, input.featureKey, input.reply)
    return
  }

  try {
    await input.sendTyping()
    const result = await generationService.generateForTeacher({
      userId: linkedUser.userId,
      source: 'telegram',
      payload: {
        featureKey: input.featureKey,
        topic: input.text,
      },
    })

    await input.reply(
      [
        featureUx[input.featureKey].resultTitle,
        '',
        trimTelegramText(result.content.outputMarkdown),
        '',
        `Qolgan kredit: ${result.subscription?.creditsRemaining ?? 0}`,
      ].join('\n'),
      resultKeyboard(input.featureKey),
    )
  } catch (error) {
    await input.reply(
      generationErrorMessage(error),
      resultKeyboard(input.featureKey),
    )
  }
}

async function consumeLinkCodeFromText(input: {
  telegramUserId: number
  telegramUsername?: string | null
  code: string
  reply: (message: string, keyboard?: ReturnType<typeof Markup.inlineKeyboard>) => Promise<unknown>
}) {
  const code = input.code.trim()

  if (!code) {
    pendingActions.set(input.telegramUserId, { type: 'link' })
    await input.reply(linkPrompt(), backKeyboard())
    return
  }

  try {
    await telegramRepository.consumeLinkCode(code, {
      id: input.telegramUserId,
      username: input.telegramUsername,
    })

    await input.reply('✅ Muvaffaqiyatli ulandingiz!', mainMenuKeyboard())
  } catch (error) {
    pendingActions.set(input.telegramUserId, { type: 'link' })
    await input.reply(linkErrorMessage(error), backKeyboard())
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
    '👋 Xush kelibsiz!',
    '',
    'Teacher Assistant AI — zamonaviy o‘qituvchilar uchun aqlli yordamchi.',
    '',
    'Boshlash uchun tanlang 👇',
  ].join('\n')
}

function helpMessage() {
  return [
    'Qanday yordam beraman? 👇',
    '',
    'Kerakli bo‘limni tanlang, mavzu yoki matn yuboring. Natijadan keyin yana davom ettirishingiz mumkin.',
  ].join('\n')
}

function linkPrompt() {
  return 'Web ilovadagi Sozlamalar bo‘limidan link code oling va shu yerga yuboring 🔐'
}

function unlinkedMessage() {
  return 'Avval web hisobingizni ulang 🔐'
}

function linkErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('expired')) {
    return 'Link code muddati tugagan. Web ilovadan yangi code oling 🔐'
  }

  if (message.includes('not found')) {
    return 'Link code topilmadi. Tekshirib qayta yuboring 🔐'
  }

  return "Hozircha ulab bo'lmadi. Qayta urinib ko'ring 🔐"
}

function generationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('not enough credits')) {
    return 'Kredit yetarli emas. Tarifni yangilab qayta urinib ko‘ring.'
  }

  if (message.includes('no active subscription')) {
    return 'Faol tarif topilmadi. Web ilovada tarifni faollashtiring.'
  }

  return "Hozircha javob tayyorlay olmadim. Birozdan keyin qayta urinib ko'ring."
}

function isGreeting(text: string) {
  return /^(salom|assalomu alaykum|hello|hi)\b/i.test(text)
}

function formatUzs(value: number) {
  return `${uzsFormatter.format(value).replace(/[\u00A0\u202F]/g, ' ')} so'm`
}

function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(featureUx.quiz.button, 'feature:quiz'),
      Markup.button.callback(featureUx.lesson_plan.button, 'feature:lesson_plan'),
    ],
    [
      Markup.button.callback(featureUx.writing_feedback.button, 'feature:writing_feedback'),
      Markup.button.callback(featureUx.speaking_questions.button, 'feature:speaking_questions'),
    ],
    [Markup.button.callback('⚙️ Sozlamalar', 'settings')],
  ])
}

function settingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Ulanish (link code)', 'settings:link')],
    [Markup.button.callback('🌐 Til', 'settings:language')],
    [Markup.button.callback('❓ Yordam', 'settings:help')],
    [Markup.button.callback('🔙 Ortga', 'back')],
  ])
}

function linkingKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Ulanish (link code)', 'settings:link')],
    [Markup.button.callback('🔙 Ortga', 'back')],
  ])
}

function backKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 Ortga', 'back')]])
}

function resultKeyboard(featureKey: BotFeatureKey) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(featureUx[featureKey].repeat, `repeat:${featureKey}`)],
    [Markup.button.callback('🔙 Ortga', 'back')],
  ])
}

function buildPlansKeyboard(
  plans: Array<{ key: PlanKey; name: string; priceMonthlyUzs: number }>,
) {
  const botLink = getTelegramBotLink()
  if (!botLink) {
    return null
  }

  const buttons: Array<
    Array<ReturnType<typeof Markup.button.url> | ReturnType<typeof Markup.button.callback>>
  > = plans
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

  buttons.push([Markup.button.callback('🔙 Ortga', 'back')])
  return Markup.inlineKeyboard(buttons)
}

function getTelegramBotLink() {
  const username = env.TELEGRAM_BOT_USERNAME?.replace(/^@+/, '').trim()
  return username ? `https://t.me/${username}` : null
}

function isBotFeatureKey(featureKey: FeatureKey | undefined): featureKey is BotFeatureKey {
  return BOT_FEATURE_KEYS.some((key) => key === featureKey)
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
    return 'Tanlangan tarif topilmadi. Asosiy menyudan qayta tanlang.'
  }

  const lines = [
    `${plan.name} tarifi tanlandi.`,
    `Narx: ${formatUzs(plan.priceMonthlyUzs)} / oy`,
    `Limit: ${plan.monthlyCredits} oylik kredit`,
    '',
    plan.description,
  ]

  lines.push('', `Davom etish: ${new URL('/app/billing', env.APP_URL).toString()}`)

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
