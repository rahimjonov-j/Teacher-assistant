import { env } from './env'
import { supabase } from './supabase'

interface ApiErrorBody {
  error?: string
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`)
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(body.error ?? 'Request failed.')
  }

  return (await response.json()) as T
}
