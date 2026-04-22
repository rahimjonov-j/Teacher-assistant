import { config } from 'dotenv'
import { z } from 'zod'
import path from 'node:path'

config()
config({ path: path.resolve(process.cwd(), '../../.env'), override: false })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_LIGHT: z.string().default('gpt-4.1-mini'),
  OPENAI_MODEL_STRONG: z.string().default('gpt-4.1'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().url().optional(),
  PDF_STORAGE_BUCKET: z.string().default('generated-pdfs'),
  SUPER_ADMIN_EMAILS: z.string().default('javohirrahimjonov546@gmail.com'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

export const hasSupabaseConfig = Boolean(
  env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY,
)

export const hasOpenAiConfig = Boolean(env.OPENAI_API_KEY)
export const hasTelegramConfig = Boolean(env.TELEGRAM_BOT_TOKEN)
export const superAdminEmails = env.SUPER_ADMIN_EMAILS
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
