import type { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { contentRepository } from '../repositories/content.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { telegramRepository } from '../repositories/telegram.repository.js'
import { dashboardService } from '../services/dashboard.service.js'
import { generationService } from '../services/generation.service.js'
import { pdfService } from '../services/pdf.service.js'
import { asyncHandler } from '../utils/async-handler.js'

const generateSchema = z.object({
  featureKey: z.enum(['quiz', 'lesson_plan', 'writing_feedback', 'speaking_questions']),
  topic: z.string().min(3).max(6000),
  gradeOrLevel: z.string().max(120).optional(),
  additionalInstructions: z.string().max(1200).optional(),
})

export const teacherController = {
  dashboard: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const dashboard = await dashboardService.getTeacherDashboard(authenticatedRequest.auth.userId)
    response.json(dashboard)
  }),

  generate: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = generateSchema.parse(request.body)
    const result = await generationService.generateForTeacher({
      userId: authenticatedRequest.auth.userId,
      source: 'web',
      payload,
    })

    response.status(201).json(result)
  }),

  history: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const search = typeof request.query.search === 'string' ? request.query.search : undefined
    const featureKey = typeof request.query.feature === 'string' ? request.query.feature : undefined
    const items = await contentRepository.listByUserId(authenticatedRequest.auth.userId, { search, featureKey })
    response.json({ items })
  }),

  contentById: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const item = await contentRepository.getById(String(request.params.id), authenticatedRequest.auth.userId)
    response.json({ item })
  }),

  exportPdf: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const result = await pdfService.exportContent(authenticatedRequest.auth.userId, String(request.params.id))
    response.json(result)
  }),

  subscription: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const subscription = await subscriptionsRepository.getActiveByUserId(authenticatedRequest.auth.userId)
    response.json({ subscription })
  }),

  createTelegramLinkCode: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const result = await telegramRepository.createLinkCode(authenticatedRequest.auth.userId)
    response.json(result)
  }),
}
