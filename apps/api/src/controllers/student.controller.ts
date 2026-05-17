import type { Request, Response } from 'express'
import { z } from 'zod'
import type { StudentAuthenticatedRequest } from '../middleware/student-auth.js'
import { assignmentRepository } from '../repositories/assignment.repository.js'
import { classRepository } from '../repositories/class.repository.js'
import { asyncHandler } from '../utils/async-handler.js'
import { createStudentToken } from '../utils/student-security.js'

const loginSchema = z.object({
  login: z.string().min(2).max(120),
  password: z.string().min(4).max(200),
})

const submitSchema = z.object({
  attemptId: z.string().uuid().optional().nullable(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  writingText: z.string().max(20000).optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
  gameScore: z.coerce.number().min(0).max(10000).optional().nullable(),
})

const audioUploadSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(3).max(120),
})

export const studentController = {
  login: asyncHandler(async (request: Request, response: Response) => {
    const payload = loginSchema.parse(request.body)
    const student = await classRepository.verifyStudentCredentials(payload.login, payload.password)
    response.json({
      token: createStudentToken(student.id),
      student,
    })
  }),

  dashboard: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as StudentAuthenticatedRequest
    const dashboard = await assignmentRepository.getStudentDashboard(authenticatedRequest.studentAuth.studentId)
    response.json(dashboard)
  }),

  assignment: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as StudentAuthenticatedRequest
    const payload = await assignmentRepository.getStudentAssignment(
      authenticatedRequest.studentAuth.studentId,
      String(request.params.id),
    )
    response.json(payload)
  }),

  startAttempt: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as StudentAuthenticatedRequest
    const attempt = await assignmentRepository.startAttempt(
      authenticatedRequest.studentAuth.studentId,
      String(request.params.id),
    )
    response.status(201).json({ attempt })
  }),

  uploadAudio: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as StudentAuthenticatedRequest
    const payload = audioUploadSchema.parse(request.body)
    const audio = await assignmentRepository.uploadSpeakingAudio(
      authenticatedRequest.studentAuth.studentId,
      String(request.params.id),
      payload,
    )
    response.status(201).json(audio)
  }),

  submit: asyncHandler(async (request: Request, response: Response) => {
    const authenticatedRequest = request as StudentAuthenticatedRequest
    const payload = submitSchema.parse(request.body)
    const result = await assignmentRepository.submitAssignment(
      authenticatedRequest.studentAuth.studentId,
      String(request.params.id),
      payload,
    )
    response.status(201).json(result)
  }),
}
