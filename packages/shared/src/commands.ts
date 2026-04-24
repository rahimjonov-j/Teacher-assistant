import type { AssistantCommandDefinition, FeatureKey } from './types.js'

type FeatureCommandConfig = {
  command: string
  description: string
  usage: string
  example: string
  featureKey: FeatureKey
  aliases: string[]
}

const featureCommandConfigs: FeatureCommandConfig[] = [
  {
    command: 'quiz',
    description: "Mavzu bo'yicha test yaratish",
    usage: '/quiz mavzu',
    example: '/quiz Kasrlar bo\'yicha 10 ta savol',
    featureKey: 'quiz',
    aliases: ['quiz', 'test'],
  },
  {
    command: 'lesson',
    description: 'Dars rejasi yaratish',
    usage: '/lesson mavzu',
    example: '/lesson 7-sinf uchun fotosintez dars rejasi',
    featureKey: 'lesson_plan',
    aliases: ['lesson', 'dars'],
  },
  {
    command: 'feedback',
    description: "Yozma ish bo'yicha feedback",
    usage: '/feedback matn',
    example: '/feedback O\'quvchi inshosiga qisqa va foydali fikr yoz',
    featureKey: 'writing_feedback',
    aliases: ['feedback', 'fikr'],
  },
  {
    command: 'speaking',
    description: 'Gapirish savollari',
    usage: '/speaking mavzu',
    example: '/speaking Travel mavzusida speaking savollar',
    featureKey: 'speaking_questions',
    aliases: ['speaking', 'gapirish'],
  },
]

export const TELEGRAM_COMMAND_DEFINITIONS: AssistantCommandDefinition[] = [
  {
    command: 'help',
    description: "Komandalar ro'yxati",
    usage: '/help',
    example: '/help',
    showInTelegramMenu: true,
  },
  {
    command: 'plans',
    description: 'Tariflar va kreditlar',
    usage: '/plans',
    example: '/plans',
    showInTelegramMenu: true,
  },
  {
    command: 'balance',
    description: 'Joriy kredit balansi',
    usage: '/balance',
    example: '/balance',
    showInTelegramMenu: true,
  },
  {
    command: 'link',
    description: "Telegram ulash bo'yicha yordam",
    usage: '/link',
    example: '/link',
    showInTelegramMenu: false,
  },
  ...featureCommandConfigs.map((item) => ({
    ...item,
    showInTelegramMenu: true,
  })),
  {
    command: 'gpt',
    description: 'Erkin savol-javob (GPT)',
    usage: '/gpt savol',
    example: '/gpt 9-sinf uchun energiya mavzusini sodda tushuntir',
    aliases: ['gpt'],
    showInTelegramMenu: true,
  },
]

export const TELEGRAM_MENU_COMMANDS = TELEGRAM_COMMAND_DEFINITIONS.filter(
  (command) => command.showInTelegramMenu !== false,
).map(({ command, description }) => ({ command, description }))

export const TELEGRAM_FEATURE_COMMANDS = TELEGRAM_COMMAND_DEFINITIONS.filter(
  (command): command is AssistantCommandDefinition & { featureKey: FeatureKey } => Boolean(command.featureKey),
)

export const TELEGRAM_COMMAND_MAP = Object.fromEntries(
  TELEGRAM_COMMAND_DEFINITIONS.map((command) => [command.command, command]),
)

export const TELEGRAM_FEATURE_COMMAND_MAP = Object.fromEntries(
  TELEGRAM_FEATURE_COMMANDS.map((command) => [command.featureKey, command]),
) as Record<FeatureKey, AssistantCommandDefinition & { featureKey: FeatureKey }>
