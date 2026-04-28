import { Router } from 'express'
import { classesController } from '../controllers/classes.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireTeacher } from '../middleware/teacher-only.js'

export const classesRouter = Router()

classesRouter.use(requireAuth, requireTeacher)
classesRouter.get('/', classesController.list)
classesRouter.post('/', classesController.create)
classesRouter.get('/submissions/pending', classesController.pendingSubmissions)
classesRouter.post('/assignments', classesController.createAssignment)
classesRouter.post('/assignments/ai', classesController.createAiAssignment)
classesRouter.post('/submissions/:id/review', classesController.reviewSubmission)
classesRouter.post('/students/:id/regenerate-password', classesController.regenerateStudentPassword)
classesRouter.post('/students/:id/transfer', classesController.transferStudent)
classesRouter.get('/:id', classesController.detail)
classesRouter.post('/:id/students', classesController.addStudent)
