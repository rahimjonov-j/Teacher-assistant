declare const __APP_ENV__:
  | {
      API_URL?: string
      SUPABASE_URL?: string
      SUPABASE_ANON_KEY?: string
      TELEGRAM_BOT_USERNAME?: string
    }
  | undefined

function pickFirstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return ''
}

export const env = {
  apiUrl: pickFirstNonEmpty(
    import.meta.env.VITE_API_URL,
    __APP_ENV__?.API_URL,
    'http://localhost:4000/api',
  ),
  supabaseUrl: pickFirstNonEmpty(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.SUPABASE_URL,
    __APP_ENV__?.SUPABASE_URL,
  ),
  supabaseAnonKey: pickFirstNonEmpty(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.SUPABASE_ANON_KEY,
    __APP_ENV__?.SUPABASE_ANON_KEY,
  ),
  telegramBotUsername: pickFirstNonEmpty(
    import.meta.env.VITE_TELEGRAM_BOT_USERNAME,
    __APP_ENV__?.TELEGRAM_BOT_USERNAME,
  ),
}
