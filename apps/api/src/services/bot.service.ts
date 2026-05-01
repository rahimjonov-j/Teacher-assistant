import {
  PLAN_MAP,
  TELEGRAM_FEATURE_COMMANDS,
  type FeatureKey,
  type PlanKey,
} from '@teacher-assistant/shared'
import { Markup, Telegraf, type Context } from 'telegraf'
import { env, hasTelegramConfig } from '../config/env.js'
import { assignmentRepository } from '../repositories/assignment.repository.js'
import { classRepository } from '../repositories/class.repository.js'
import { plansRepository } from '../repositories/plans.repository.js'
import { telegramRepository } from '../repositories/telegram.repository.js'
import { dashboardService } from './dashboard.service.js'
import { generationService } from './generation.service.js'

let bot: Telegraf | null = null
let resolvedBotUsername: string | null = null

const TELEGRAM_TEXT_LIMIT = 3800
const uzsFormatter = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
})

const TELEGRAM_MENU_COMMANDS = [
  { command: 'login', description: 'Student login' },
  { command: 'tasks', description: 'Student tasks' },
  { command: 'top', description: 'Class top 10' },
  { command: 'profile', description: 'Student profile' },
  { command: 'start', description: '🚀 Botni ishga tushirish' },
  { command: 'menu', description: '🏠 Asosiy menyu' },
  { command: 'quiz', description: '📝 Test yaratish' },
  { command: 'lesson', description: '📚 Dars rejasi yaratish' },
  { command: 'feedback', description: '✍️ Writing feedback' },
  { command: 'speaking', description: '🎤 Speaking savollari' },
  { command: 'plans', description: '💎 Tariflar' },
  { command: 'balance', description: '💳 Kredit balans' },
  { command: 'link', description: '🔗 Web hisobni ulash' },
  { command: 'help', description: '❓ Yordam' },
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
  | {
      type: 'student_login'
    }

type InlineKeyboard = ReturnType<typeof Markup.inlineKeyboard>

const pendingActions = new Map<number, PendingAction>()

const helpIssues = {
  code: {
    button: '🔑 Kod topolmayapman',
    text: 'Web ilovaga kiring. Sidebar orqali "Telegram kod" sahifasini oching va "Kod yaratish" tugmasini bosing.',
  },
  link: {
    button: '🔗 Bot ulanmayapti',
    text: 'Yangi kod yarating va botga aynan shu kodni yuboring. Kod 20 daqiqa ichida ishlatilishi kerak.',
  },
  ai: {
    button: '🤖 AI javob bermayapti',
    text: 'Avval hisob ulanganini tekshiring. Keyin mavzuni qisqa va aniq yozing. Masalan: "Fotosintez bo\'yicha 10 ta test".',
  },
  credits: {
    button: '💳 Kredit yetmayapti',
    text: 'Kredit tugagan bo\'lsa, web ilovadagi "Tariflar" sahifasidan tarifni yangilang yoki keyingi davrni kuting.',
  },
  result: {
    button: '🧩 Natija mos emas',
    text: 'Mavzuga sinf, fan va talabni qo\'shib yozing. Masalan: "7-sinf biologiya, fotosintez, 8 ta oson test".',
  },
  web: {
    button: '🌐 Web ochilmayapti',
    text: 'Internetni tekshiring va qayta kiring. Agar lokal test bo\'lsa, web ilova ochiq turganiga ishonch hosil qiling.',
  },
  language: {
    button: '🇺🇿 Til muammosi',
    text: 'Bot asosiy javoblarni o\'zbek tilida beradi. Agar natija boshqa tilda chiqsa, so\'rovga "o\'zbek tilida" deb qo\'shing.',
  },
} as const

type HelpIssueKey = keyof typeof helpIssues

const featureUx: Record<
  BotFeatureKey,
  {
    button: string
    prompt: string
    repeat: string
    resultTitle: string
    example: string
  }
> = {
  quiz: {
    button: '📝 Test yaratish',
    prompt: 'Qaysi mavzuda test yaratamiz?',
    repeat: '🔁 Yana test',
    resultTitle: '📝 Test tayyor',
    example: 'Masalan: 7-sinf biologiya, fotosintez bo\'yicha 10 ta test',
  },
  lesson_plan: {
    button: '📚 Dars reja',
    prompt: 'Qaysi mavzuda dars reja tuzaylik?',
    repeat: '🔁 Yana reja',
    resultTitle: '📚 Dars reja tayyor',
    example: 'Masalan: 8-sinf algebra, kvadrat tenglama uchun 45 daqiqalik reja',
  },
  writing_feedback: {
    button: '✍️ Writing tahlil',
    prompt: 'Matn yuboring, men uni tahlil qilib beraman.',
    repeat: '🔁 Yana tahlil',
    resultTitle: '✍️ Tahlil tayyor',
    example: 'Masalan: o\'quvchi inshosini yuboring yoki baholash mezonini yozing',
  },
  speaking_questions: {
    button: '🎤 Speaking savol',
    prompt: 'Qaysi mavzuda speaking savollar kerak?',
    repeat: '🔁 Yana savol',
    resultTitle: '🎤 Savollar tayyor',
    example: 'Masalan: Travel mavzusida B1 daraja uchun 12 ta speaking savol',
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

export async function getTelegramBotStatus() {
  const instance = getTelegramBot()

  if (!instance) {
    return {
      configured: false,
      webhookConfigured: false,
      username: null,
      webhookUrl: null,
      pendingUpdateCount: null,
    }
  }

  const me = await instance.telegram.getMe()
  resolvedBotUsername = me.username ?? resolvedBotUsername

  const webhookInfo = await instance.telegram.getWebhookInfo()
  const configuredUsername = env.TELEGRAM_BOT_USERNAME?.replace(/^@+/, '').trim() || null

  return {
    configured: true,
    webhookConfigured: Boolean(webhookInfo.url),
    configuredUsername,
    tokenUsername: me.username,
    usernameMatchesConfig: !configuredUsername || configuredUsername === me.username,
    webhookUrl: webhookInfo.url || null,
    pendingUpdateCount: webhookInfo.pending_update_count,
    lastErrorDate: webhookInfo.last_error_date ?? null,
    lastErrorMessage: webhookInfo.last_error_message ?? null,
  }
}

export async function bootstrapTelegramBot() {
  const instance = getTelegramBot()
  if (!instance) {
    return
  }

  const me = await instance.telegram.getMe()
  resolvedBotUsername = me.username ?? null

  await instance.telegram.deleteMyCommands()

  const webhookUrl = getUsableWebhookUrl(env.TELEGRAM_WEBHOOK_URL)
  if (webhookUrl) {
    await instance.telegram.setWebhook(webhookUrl, {
      drop_pending_updates: true,
    })
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
    if (!context.from) {
      return
    }

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
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.reply(menuMessage(), mainMenuKeyboard())
  })

  instance.command('help', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.reply(helpMessage(), helpKeyboard())
  })

  instance.command('link', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.set(context.from.id, { type: 'link' })
    await context.reply(linkPrompt(), linkCodeKeyboard())
  })

  instance.command('login', async (context) => {
    if (!context.from) {
      return
    }

    const credentials = extractCommandArgument(context.message.text, 'login')
    if (!credentials) {
      pendingActions.set(context.from.id, { type: 'student_login' })
      await context.reply('Student login uchun: /login LOGIN PASSWORD')
      return
    }

    await loginStudentFromTelegram(context.from.id, context.from.username, credentials, (message) =>
      context.reply(message),
    )
  })

  instance.command('tasks', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await replyStudentTasks(context.from.id, (message) => context.reply(message))
  })

  instance.command('top', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await replyStudentTop(context.from.id, (message) => context.reply(message))
  })

  instance.command('profile', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await replyStudentProfile(context.from.id, (message) => context.reply(message))
  })

  instance.command('plans', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    try {
      const plans = await plansRepository.listAll()
      const lines = plans.map(
        (plan) => `${plan.name}: ${plan.monthlyCredits} kredit / ${formatUzs(plan.priceMonthlyUzs)}`,
      )
      const plansKeyboard = buildPlansKeyboard(plans)
      await context.reply(plansMessage(lines), plansKeyboard ?? mainMenuKeyboard())
    } catch {
      await context.reply("Tariflarni hozircha ko'rsata olmadim.", mainMenuKeyboard())
    }
  })

  instance.command('balance', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    const linkedUser = await telegramRepository.findByTelegramUserId(context.from.id)
    if (!linkedUser) {
      await context.reply(unlinkedMessage(), linkingKeyboard())
      return
    }

    const dashboard = await dashboardService.getTeacherDashboard(linkedUser.userId)
    await context.reply(balanceMessage(dashboard), mainMenuKeyboard())
  })

  instance.command('gpt', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.reply(menuMessage('🤖 GPT rejimi uchun kerakli bo\'limni tanlang.'), mainMenuKeyboard())
  })

  TELEGRAM_FEATURE_COMMANDS.forEach((command) => {
    if (isBotFeatureKey(command.featureKey)) {
      registerQuickAction(instance, command.command, command.featureKey)
    }
  })

  BOT_FEATURE_KEYS.forEach((featureKey) => {
    instance.action(`feature:${featureKey}`, async (context) => {
      if (!context.from) {
        return
      }

      await context.answerCbQuery()
      await promptForFeature(context.from.id, featureKey, (message, keyboard) =>
        updateTelegramMessage(context, message, keyboard),
      )
    })

    instance.action(`repeat:${featureKey}`, async (context) => {
      if (!context.from) {
        return
      }

      await context.answerCbQuery()
      await promptForFeature(context.from.id, featureKey, (message, keyboard) =>
        updateTelegramMessage(context, message, keyboard),
      )
    })
  })

  instance.action('balance', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    const linkedUser = await telegramRepository.findByTelegramUserId(context.from.id)

    if (!linkedUser) {
      await updateTelegramMessage(context, unlinkedMessage(), linkingKeyboard())
      return
    }

    const dashboard = await dashboardService.getTeacherDashboard(linkedUser.userId)
    await updateTelegramMessage(context, balanceMessage(dashboard), mainMenuKeyboard())
  })

  instance.action('plans', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()

    try {
      const plans = await plansRepository.listAll()
      const lines = plans.map(
        (plan) => `${plan.name}: ${plan.monthlyCredits} kredit / ${formatUzs(plan.priceMonthlyUzs)}`,
      )
      await updateTelegramMessage(context, plansMessage(lines), buildPlansKeyboard(plans) ?? mainMenuKeyboard())
    } catch {
      await updateTelegramMessage(context, "Tariflarni hozircha ko'rsata olmadim.", mainMenuKeyboard())
    }
  })

  instance.action('settings', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await updateTelegramMessage(context, settingsMessage(), settingsKeyboard())
  })

  instance.action('settings:link', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.set(context.from.id, { type: 'link' })
    await context.answerCbQuery()
    await updateTelegramMessage(context, linkPrompt(), linkCodeKeyboard())
  })

  instance.action('settings:language', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await updateTelegramMessage(context, '🇺🇿 Bot tili: O\'zbek tili\n\nHozircha asosiy javoblar Uzbek Latin formatida beriladi.', backKeyboard())
  })

  instance.action('settings:help', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await updateTelegramMessage(context, helpMessage(), helpKeyboard())
  })

  instance.action('help:other', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await updateTelegramMessage(context, '🛠 Boshqa muammolar\n\nQuyidagilardan birini tanlang:', helpOtherKeyboard())
  })

  Object.keys(helpIssues).forEach((issueKey) => {
    instance.action(`help:${issueKey}`, async (context) => {
      if (!context.from) {
        return
      }

      pendingActions.delete(context.from.id)
      await context.answerCbQuery()
      await updateTelegramMessage(
        context,
        helpIssueMessage(issueKey as HelpIssueKey),
        helpAnswerKeyboard(),
      )
    })
  })

  instance.action('back', async (context) => {
    if (!context.from) {
      return
    }

    pendingActions.delete(context.from.id)
    await context.answerCbQuery()
    await updateTelegramMessage(context, menuMessage(), mainMenuKeyboard())
  })

  instance.on('text', async (context) => {
    if (!context.from) {
      return
    }

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

    if (pendingAction?.type === 'student_login') {
      pendingActions.delete(context.from.id)
      await loginStudentFromTelegram(context.from.id, context.from.username, text, (message) =>
        context.reply(message),
      )
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
      await context.reply(menuMessage('👋 Salom! Kerakli bo\'limni tanlang.'), mainMenuKeyboard())
      return
    }

    await context.reply(menuMessage('✨ Boshlash uchun bo\'lim tanlang.'), mainMenuKeyboard())
  })
  instance.on('voice', async (context) => {
    if (!context.from) {
      return
    }

    const student = await classRepository.findStudentByTelegramUserId(context.from.id)
    if (!student) {
      await context.reply('Avval /login LOGIN PASSWORD orqali student hisobingizni ulang.')
      return
    }

    const assignment = await assignmentRepository.firstActiveSpeakingAssignment(student.id)
    if (!assignment) {
      await context.reply('Faol speaking task topilmadi.')
      return
    }

    await assignmentRepository.submitAssignment(student.id, assignment.id, {
      telegramFileId: context.message.voice.file_id,
    })
    await context.reply('Speaking audio qabul qilindi. Oqituvchi tekshirgandan keyin ball qoshiladi.')
  })
}

function registerQuickAction(instance: Telegraf, command: string, featureKey: BotFeatureKey) {
  instance.command(command, async (context) => {
    if (!context.from) {
      return
    }

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

async function loginStudentFromTelegram(
  telegramUserId: number,
  telegramUsername: string | undefined,
  credentialsText: string,
  reply: (message: string) => Promise<unknown>,
) {
  const [login, password] = credentialsText.trim().split(/\s+/, 2)

  if (!login || !password) {
    await reply('Student login uchun: /login LOGIN PASSWORD')
    return
  }

  try {
    const student = await classRepository.verifyStudentCredentials(login, password)
    await classRepository.linkTelegramStudent(student.id, telegramUserId, telegramUsername)
    await reply(`Hisob ulandi: ${student.fullName}\n/tasks - topshiriqlar\n/top - class top 10\n/profile - profil`)
  } catch {
    await reply('Login yoki parol notogri. Oqituvchingiz bergan malumotni tekshiring.')
  }
}

async function replyStudentTasks(telegramUserId: number, reply: (message: string) => Promise<unknown>) {
  const student = await classRepository.findStudentByTelegramUserId(telegramUserId)
  if (!student) {
    await reply('Avval /login LOGIN PASSWORD orqali student hisobingizni ulang.')
    return
  }

  const dashboard = await assignmentRepository.getStudentDashboard(student.id)
  const active = dashboard.activeAssignments.slice(0, 10)

  if (active.length === 0) {
    await reply('Hozircha faol topshiriq yoq.')
    return
  }

  await reply(
    [
      'Faol topshiriqlar:',
      '',
      ...active.map((assignment, index) => {
        const deadline = assignment.deadlineAt ? new Date(assignment.deadlineAt).toLocaleString('uz-UZ') : 'deadline yoq'
        return `${index + 1}. ${assignment.title} - ${assignment.type} - ${deadline}`
      }),
      '',
      'Testlarni web ilovada ishlang. Writing matnini bot orqali yuborishingiz ham mumkin.',
    ].join('\n'),
  )
}

async function replyStudentTop(telegramUserId: number, reply: (message: string) => Promise<unknown>) {
  const student = await classRepository.findStudentByTelegramUserId(telegramUserId)
  if (!student) {
    await reply('Avval /login LOGIN PASSWORD orqali student hisobingizni ulang.')
    return
  }

  const leaderboard = await assignmentRepository.topForTelegram(student.id)
  if (leaderboard.length === 0) {
    await reply('Leaderboard hali bosh.')
    return
  }

  await reply(
    leaderboard
      .slice(0, 10)
      .map((entry) => `${entry.rank <= 3 ? 'CROWN ' : ''}${entry.rank}. ${entry.fullName} - ${entry.totalMonthlyScore} points`)
      .join('\n'),
  )
}

async function replyStudentProfile(telegramUserId: number, reply: (message: string) => Promise<unknown>) {
  const student = await classRepository.findStudentByTelegramUserId(telegramUserId)
  if (!student) {
    await reply('Avval /login LOGIN PASSWORD orqali student hisobingizni ulang.')
    return
  }

  const dashboard = await assignmentRepository.getStudentDashboard(student.id)
  await reply(
    [
      dashboard.student.fullName,
      `${dashboard.student.className} / ${dashboard.student.groupName}`,
      `Rank: ${dashboard.rank ?? '-'}`,
      `Monthly score: ${dashboard.student.totalMonthlyScore}`,
      `Completed: ${dashboard.student.completedAssignments}`,
    ].join('\n'),
  )
}

async function updateTelegramMessage(context: Context, message: string, keyboard?: InlineKeyboard) {
  try {
    await context.editMessageText(message, keyboard)
  } catch (error) {
    console.warn('Telegram message edit failed, falling back to reply:', error)
    await context.reply(message, keyboard)
  }
}

async function promptForFeature(
  telegramUserId: number,
  featureKey: BotFeatureKey,
  reply: (message: string, keyboard?: InlineKeyboard) => Promise<unknown>,
) {
  const linkedUser = await telegramRepository.findByTelegramUserId(telegramUserId)
  if (!linkedUser) {
    pendingActions.delete(telegramUserId)
    await reply(unlinkedMessage(), linkingKeyboard())
    return
  }

  pendingActions.set(telegramUserId, { type: 'feature', featureKey })
  await reply(featurePromptMessage(featureKey), backKeyboard())
}

async function runFeatureGeneration(input: {
  telegramUserId: number
  featureKey: BotFeatureKey
  text: string
  sendTyping: () => Promise<unknown>
  reply: (message: string, keyboard?: InlineKeyboard) => Promise<unknown>
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
      resultMessage(input.featureKey, result.content.outputMarkdown, result.subscription?.creditsRemaining),
      resultKeyboard(input.featureKey),
    )
  } catch (error) {
    await input.reply(generationErrorMessage(error), resultKeyboard(input.featureKey))
  }
}

async function consumeLinkCodeFromText(input: {
  telegramUserId: number
  telegramUsername?: string | null
  code: string
  reply: (message: string, keyboard?: InlineKeyboard) => Promise<unknown>
}) {
  const code = input.code.trim()

  if (!code) {
    pendingActions.set(input.telegramUserId, { type: 'link' })
    await input.reply(linkPrompt(), linkCodeKeyboard())
    return
  }

  try {
    await telegramRepository.consumeLinkCode(code, {
      id: input.telegramUserId,
      username: input.telegramUsername,
    })

    await input.reply('Muvaffaqiyatli ulandingiz!', mainMenuKeyboard())
  } catch (error) {
    pendingActions.set(input.telegramUserId, { type: 'link' })
    await input.reply(linkErrorMessage(error), linkCodeKeyboard())
  }
}

function settingsMessage() {
  return [
    '⚙️ Sozlamalar',
    '',
    'Hisobni ulash, til va yordam bo\'limlarini shu yerdan boshqarishingiz mumkin.',
  ].join('\n')
}

function plansMessage(lines: string[]) {
  return [
    '💎 Tariflar',
    '',
    ...lines.map((line) => `• ${line}`),
    '',
    'Tarifni web ilovada faollashtirishingiz mumkin.',
  ].join('\n')
}

function balanceMessage(dashboard: {
  subscription?: {
    planName?: string | null
    creditsRemaining?: number | null
    creditsTotal?: number | null
  } | null
}) {
  const remaining = dashboard.subscription?.creditsRemaining ?? 0
  const total = dashboard.subscription?.creditsTotal ?? 0

  return [
    '💳 Kredit balans',
    '',
    `💎 Tarif: ${dashboard.subscription?.planName ?? "Faol tarif yo'q"}`,
    `⚡ Qolgan kredit: ${remaining} / ${total}`,
    '',
    total > 0 ? creditBar(remaining, total) : 'Tarif faollashgandan keyin balans shu yerda ko\'rinadi.',
  ].join('\n')
}

function creditBar(remaining: number, total: number) {
  const slots = 10
  const filled = Math.max(0, Math.min(slots, Math.round((remaining / total) * slots)))
  return `${'●'.repeat(filled)}${'○'.repeat(slots - filled)}`
}

function featurePromptMessage(featureKey: BotFeatureKey) {
  const feature = featureUx[featureKey]

  return [
    `${feature.button}`,
    '',
    feature.prompt,
    '',
    `💡 ${feature.example}`,
  ].join('\n')
}

function resultMessage(
  featureKey: BotFeatureKey,
  outputMarkdown: string,
  creditsRemaining: number | null | undefined,
) {
  return [
    featureUx[featureKey].resultTitle,
    '━━━━━━━━━━━━━━',
    trimTelegramText(outputMarkdown),
    '━━━━━━━━━━━━━━',
    `⚡ Qolgan kredit: ${creditsRemaining ?? 0}`,
  ].join('\n')
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
    'Teacher Assistant AI',
    '',
    'Assalomu alaykum. Men darsga tayyorgarlikni tezlashtiraman.',
    '',
    'Test, dars rejasi, writing tahlil va speaking savollarini bir necha soniyada tayyorlab beraman.',
    '',
    'Boshlash uchun pastdagi tugmalardan birini tanlang.',
  ].join('\n')
}

function menuMessage(intro = 'Asosiy menyu') {
  return [
    intro,
    '',
    'Kerakli bo\'limni tanlang. Hisobingiz ulanmagan bo\'lsa, avval "Ulanish" tugmasi orqali web profilingizni bog\'lang.',
  ].join('\n')
}

function helpMessage() {
  return [
    '❓ Yordam markazi',
    '',
    'Tez komandalar:',
    '🚀 /start - botni qayta boshlash',
    '🏠 /menu - asosiy menyu',
    '📝 /quiz mavzu - test yaratish',
    '📚 /lesson mavzu - dars rejasi',
    '✍️ /feedback matn - writing tahlil',
    '🎤 /speaking mavzu - speaking savollar',
    '💳 /balance - kredit balans',
    '💎 /plans - tariflar',
    '🔗 /link - web hisobni ulash',
    '',
    'Muammo turini tanlang, men qisqa yo\'l ko\'rsataman:',
  ].join('\n')
}

function helpIssueMessage(issueKey: HelpIssueKey) {
  const issue = helpIssues[issueKey]
  return [issue.button, '', issue.text].join('\n')
}

function linkPrompt() {
  const lines = [
    '🔗 Web hisobni ulash',
    '',
    '1. Web ilovaga kiring yoki ro\'yxatdan o\'ting.',
    '2. "Telegram kod" sahifasidan link code oling.',
    '3. Kodni shu chatga yuboring.',
    '',
    'Kod odatda 20 daqiqa ichida ishlatilishi kerak.',
  ]

  if (!getLinkCodePageUrl()) {
    lines.push('', 'Hozir web manzil lokal sozlangan. Web ilovada sidebar orqali "Telegram kod" sahifasini oching.')
  }

  return lines.join('\n')
}

function unlinkedMessage() {
  return '🔐 Avval web hisobingizni ulang.\n\nUlangandan keyin kredit, tarix va tariflaringiz bot bilan birga ishlaydi.'
}

function linkErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('expired')) {
    return '⏱ Link code muddati tugagan. Web ilovadan yangi code oling.'
  }

  if (message.includes('not found')) {
    return '🔎 Link code topilmadi. Tekshirib qayta yuboring.'
  }

  return "⚠️ Hozircha ulab bo'lmadi. Qayta urinib ko'ring."
}

function generationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('not enough credits')) {
    return '💳 Kredit yetarli emas. Tarifni yangilab qayta urinib ko\'ring.'
  }

  if (message.includes('no active subscription')) {
    return '💎 Faol tarif topilmadi. Web ilovada tarifni faollashtiring.'
  }

  return "⚠️ Hozircha javob tayyorlay olmadim. Birozdan keyin qayta urinib ko'ring."
}

function isGreeting(text: string) {
  return /^(salom|assalomu alaykum|hello|hi)\b/i.test(text)
}

function formatUzs(value: number) {
  return `${uzsFormatter.format(value).replace(/[\u00A0\u202F]/g, ' ')} so'm`
}

function mainMenuKeyboard() {
  const rows: Array<
    Array<ReturnType<typeof Markup.button.url> | ReturnType<typeof Markup.button.callback>>
  > = [
    [
      Markup.button.callback(featureUx.quiz.button, 'feature:quiz'),
      Markup.button.callback(featureUx.lesson_plan.button, 'feature:lesson_plan'),
    ],
    [
      Markup.button.callback(featureUx.writing_feedback.button, 'feature:writing_feedback'),
      Markup.button.callback(featureUx.speaking_questions.button, 'feature:speaking_questions'),
    ],
    [
      Markup.button.callback('💳 Balans', 'balance'),
      Markup.button.callback('💎 Tariflar', 'plans'),
    ],
    [
      Markup.button.callback('🔗 Ulanish', 'settings:link'),
      Markup.button.callback('⚙️ Sozlamalar', 'settings'),
    ],
  ]

  const appUrl = getAppUrl()
  if (appUrl) {
    rows.push([Markup.button.url('🌐 Web ilova', appUrl)])
  }

  return Markup.inlineKeyboard(rows)
}

function settingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Ulanish (link code)', 'settings:link')],
    [Markup.button.callback('🇺🇿 Til', 'settings:language')],
    [Markup.button.callback('❓ Yordam', 'settings:help')],
    [Markup.button.callback('⬅️ Ortga', 'back')],
  ])
}

function helpKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(helpIssues.code.button, 'help:code')],
    [Markup.button.callback(helpIssues.link.button, 'help:link')],
    [Markup.button.callback(helpIssues.ai.button, 'help:ai')],
    [Markup.button.callback('➕ Boshqa', 'help:other')],
    [Markup.button.callback('⬅️ Ortga', 'back')],
  ])
}

function helpOtherKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(helpIssues.credits.button, 'help:credits')],
    [Markup.button.callback(helpIssues.result.button, 'help:result')],
    [Markup.button.callback(helpIssues.web.button, 'help:web')],
    [Markup.button.callback(helpIssues.language.button, 'help:language')],
    [Markup.button.callback('⬅️ Ortga', 'back')],
  ])
}

function helpAnswerKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Boshqa muammolar', 'help:other')],
    [Markup.button.callback('⬅️ Ortga', 'back')],
  ])
}

function linkingKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Ulanish (link code)', 'settings:link')],
    [Markup.button.callback('⬅️ Ortga', 'back')],
  ])
}

function linkCodeKeyboard() {
  const linkCodePageUrl = getLinkCodePageUrl()
  const buttons: Array<
    Array<ReturnType<typeof Markup.button.url> | ReturnType<typeof Markup.button.callback>>
  > = []

  if (linkCodePageUrl) {
    buttons.push([Markup.button.url('🔑 Kodni olish', linkCodePageUrl)])
  }

  buttons.push([Markup.button.callback('⬅️ Ortga', 'back')])
  return Markup.inlineKeyboard(buttons)
}

function backKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback('⬅️ Ortga', 'back')]])
}

function resultKeyboard(featureKey: BotFeatureKey) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(featureUx[featureKey].repeat, `repeat:${featureKey}`)],
    [Markup.button.callback('🏠 Asosiy menyu', 'back')],
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
    .map((plan) => [
      Markup.button.url(`💎 ${plan.name} sotib olish`, `${botLink}?start=upgrade_${plan.key}`),
    ])

  if (buttons.length === 0) {
    return null
  }

  buttons.push([Markup.button.callback('⬅️ Ortga', 'back')])
  return Markup.inlineKeyboard(buttons)
}

function getTelegramBotLink() {
  const username = (resolvedBotUsername ?? env.TELEGRAM_BOT_USERNAME)?.replace(/^@+/, '').trim()
  return username ? `https://t.me/${username}` : null
}

function getAppUrl() {
  try {
    const url = new URL(env.APP_URL)
    const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

    if (blockedHosts.has(url.hostname) || url.hostname.endsWith('.local')) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function getLinkCodePageUrl() {
  try {
    const url = new URL('/app/telegram-link', env.APP_URL)
    const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

    if (blockedHosts.has(url.hostname) || url.hostname.endsWith('.local')) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
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
