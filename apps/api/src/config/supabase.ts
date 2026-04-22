import { createClient } from '@supabase/supabase-js'
import { env, hasSupabaseConfig } from './env.js'

let adminClient: any = null
let anonClient: any = null

function ensureConfig() {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase environment variables are missing.')
  }
}

export function getSupabaseAdminClient() {
  ensureConfig()

  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return adminClient
}

export function getSupabaseAnonClient() {
  ensureConfig()

  if (!anonClient) {
    anonClient = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return anonClient
}
