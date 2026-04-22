import type { NextFunction, RequestHandler, Response } from 'express'
import type { AuthenticatedRequest } from './auth.js'
import { ApiError } from '../utils/api-error.js'

export const requireAdmin: RequestHandler = (
  request,
  _response: Response,
  next: NextFunction,
) => {
  const authenticatedRequest = request as AuthenticatedRequest

  if (authenticatedRequest.auth.role !== 'admin') {
    next(new ApiError(403, 'Admin access required.'))
    return
  }

  next()
}
