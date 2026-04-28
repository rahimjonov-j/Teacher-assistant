import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { classRepository } from '../repositories/class.repository.js'
import { verifyStudentToken } from '../utils/student-security.js'
import { ApiError } from '../utils/api-error.js'

export interface StudentAuthenticatedRequest extends Request {
  studentAuth: {
    studentId: string
    teacherId: string
    classId: string
  }
}

export const requireStudentAuth: RequestHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const authHeader = request.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    next(new ApiError(401, 'Missing student token.'))
    return
  }

  try {
    const studentId = verifyStudentToken(token)
    const student = await classRepository.getStudentById(studentId)

    if (!student || student.status !== 'active') {
      next(new ApiError(403, 'Student account is not active.'))
      return
    }

    ;(request as StudentAuthenticatedRequest).studentAuth = {
      studentId,
      teacherId: student.teacherId,
      classId: student.classId,
    }

    next()
  } catch (error) {
    next(error)
  }
}
