import type { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { profilesRepository } from '../repositories/profiles.repository.js'
import { asyncHandler } from '../utils/async-handler.js'

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).nullable(),
  schoolName: z.string().max(160).nullable(),
  gradeFocus: z.string().max(120).nullable(),
  timezone: z.string().max(80).nullable(),
  telegramHandle: z.string().max(80).nullable(),
})

export const authController = {
  me: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const profile = await profilesRepository.getById(authenticatedRequest.auth.userId)
    response.json({ profile })
  }),

  updateProfile: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = updateProfileSchema.parse(request.body)
    const profile = await profilesRepository.update(authenticatedRequest.auth.userId, payload)
    response.json({ profile })
  }),
}
