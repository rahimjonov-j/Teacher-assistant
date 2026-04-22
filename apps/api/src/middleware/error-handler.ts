import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/api-error.js'

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ error: error.message })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation failed.',
      issues: error.flatten().fieldErrors,
    })
    return
  }

  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server.' })
}
