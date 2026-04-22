import { env } from './env'
import { supabase } from './supabase'

interface ApiErrorBody {
  error?: string
}

export class ApiRequestError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
  }
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
    throw new ApiRequestError(body.error ?? 'Request failed.', response.status)
  }

  return (await response.json()) as T
}
