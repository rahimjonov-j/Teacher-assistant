import { Router } from 'express'
import { studentController } from '../controllers/student.controller.js'
import { requireStudentAuth } from '../middleware/student-auth.js'

export const studentRouter = Router()

studentRouter.post('/login', studentController.login)
studentRouter.use(requireStudentAuth)
studentRouter.get('/dashboard', studentController.dashboard)
studentRouter.get('/assignments/:id', studentController.assignment)
studentRouter.post('/assignments/:id/start', studentController.startAttempt)
studentRouter.post('/assignments/:id/submit', studentController.submit)
