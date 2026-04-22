import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)

export const supabase = createClient(env.supabaseUrl || 'https://placeholder.supabase.co', env.supabaseAnonKey || 'placeholder')
