import type { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { assignmentRepository } from '../repositories/assignment.repository.js'
import { classRepository } from '../repositories/class.repository.js'
import { asyncHandler } from '../utils/async-handler.js'

const classSchema = z.object({
  name: z.string().min(2).max(120),
  groupName: z.string().min(1).max(40),
  gradeLevel: z.string().max(40).optional().nullable(),
})

const addStudentSchema = z.object({
  fullName: z.string().min(2).max(140),
})

const assignmentSchema = z.object({
  classId: z.string().uuid().optional().nullable(),
  recipientStudentIds: z.array(z.string().uuid()).optional(),
  title: z.string().min(2).max(180),
  description: z.string().max(1200).optional().nullable(),
  type: z.enum(['multiple_choice', 'variant_test', 'open_question', 'writing', 'speaking', 'mini_game']),
  pointsPerCorrect: z.coerce.number().min(0).max(1000).default(1),
  deadlineAt: z.string().datetime().optional().nullable(),
  timeLimitMinutes: z.coerce.number().int().positive().max(240).optional().nullable(),
  maxAttempts: z.coerce.number().int().min(1).max(10).default(2),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1).max(2000),
        variantKey: z.string().max(40).optional().nullable(),
        points: z.coerce.number().min(0).max(1000).optional().nullable(),
        options: z
          .array(
            z.object({
              optionText: z.string().min(1).max(1000),
              isCorrect: z.boolean().default(false),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  gameConfig: z.record(z.string(), z.unknown()).optional(),
})

const reviewSchema = z.object({
  scoreAwarded: z.coerce.number().min(0).max(10000),
  feedback: z.string().max(3000).optional().nullable(),
})

const transferSchema = z.object({
  toClassId: z.string().uuid(),
  note: z.string().max(1000).optional().nullable(),
})

export const classesController = {
  list: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    response.json(await classRepository.listClasses(authenticatedRequest.auth.userId))
  }),

  create: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = classSchema.parse(request.body)
    const item = await classRepository.createClass(authenticatedRequest.auth.userId, payload)
    response.status(201).json({ class: item })
  }),

  detail: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = await classRepository.getClassDetail(authenticatedRequest.auth.userId, String(request.params.id))
    response.json(payload)
  }),

  addStudent: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = addStudentSchema.parse(request.body)
    const result = await classRepository.addStudent(
      authenticatedRequest.auth.userId,
      String(request.params.id),
      payload.fullName,
    )
    response.status(201).json(result)
  }),

  regenerateStudentPassword: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const credentials = await classRepository.regenerateStudentPassword(
      authenticatedRequest.auth.userId,
      String(request.params.id),
    )
    response.json({ credentials })
  }),

  transferStudent: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = transferSchema.parse(request.body)
    const student = await classRepository.transferStudent(
      authenticatedRequest.auth.userId,
      String(request.params.id),
      payload.toClassId,
      payload.note,
    )
    response.json({ student })
  }),

  createAssignment: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = assignmentSchema.parse(request.body)
    const assignment = await assignmentRepository.createAssignment(authenticatedRequest.auth.userId, payload)
    response.status(201).json({ assignment })
  }),

  pendingSubmissions: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const submissions = await assignmentRepository.listPendingSubmissions(authenticatedRequest.auth.userId)
    response.json({ submissions })
  }),

  reviewSubmission: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as AuthenticatedRequest
    const payload = reviewSchema.parse(request.body)
    const submission = await assignmentRepository.reviewSubmission(
      authenticatedRequest.auth.userId,
      String(request.params.id),
      payload,
    )
    response.json({ submission })
  }),
}
