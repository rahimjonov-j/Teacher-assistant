import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { getSupabaseAnonClient } from '../config/supabase.js'
import { profilesRepository } from '../repositories/profiles.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { ApiError } from '../utils/api-error.js'

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: string
    email: string
    role: 'teacher' | 'admin'
  }
}

export const requireAuth: RequestHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const authHeader = request.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    next(new ApiError(401, 'Missing bearer token.'))
    return
  }

  const supabase = getSupabaseAnonClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    next(new ApiError(401, 'Invalid or expired session.'))
    return
  }

  const profile = await profilesRepository.upsertFromAuthUser({
    id: data.user.id,
    email: data.user.email ?? '',
    fullName:
      (typeof data.user.user_metadata.full_name === 'string' && data.user.user_metadata.full_name) ||
      null,
  })

  if (profile.role === 'teacher') {
    await subscriptionsRepository.ensureDefaultForUser(data.user.id)
  }

  ;(request as AuthenticatedRequest).auth = {
    userId: data.user.id,
    email: data.user.email ?? '',
    role: profile.role,
  }

  next()
}
