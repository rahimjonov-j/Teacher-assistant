import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { AuthenticatedRequest } from './auth.js'
import { ApiError } from '../utils/api-error.js'

export const requireTeacher: RequestHandler = (request: Request, _response: Response, next: NextFunction) => {
  const authenticatedRequest = request as AuthenticatedRequest

  if (authenticatedRequest.auth.role !== 'teacher') {
    next(new ApiError(403, 'Teacher access required.'))
    return
  }

  next()
}
