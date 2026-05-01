import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)

let supabaseClientPromise: Promise<SupabaseClient> | null = null

async function createBrowserSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')

  return createClient(env.supabaseUrl || 'https://placeholder.supabase.co', env.supabaseAnonKey || 'placeholder')
}

export function preloadSupabaseClient() {
  if (!isSupabaseConfigured) {
    return Promise.resolve(null)
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = createBrowserSupabaseClient()
  }

  return supabaseClientPromise
}

export async function getSupabaseClient() {
  const client = await preloadSupabaseClient()

  if (!client) {
    throw new Error('Supabase sozlanmagan.')
  }

  return client
}

export async function getSupabaseSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const supabase = await getSupabaseClient()
  const { data } = await supabase.auth.getSession()

  return data.session
}
