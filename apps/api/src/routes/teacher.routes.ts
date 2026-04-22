import { Router } from 'express'
import { teacherController } from '../controllers/teacher.controller.js'
import { requireAuth } from '../middleware/auth.js'

export const teacherRouter = Router()

teacherRouter.use(requireAuth)
teacherRouter.get('/dashboard', teacherController.dashboard)
teacherRouter.post('/generate', teacherController.generate)
teacherRouter.get('/history', teacherController.history)
teacherRouter.get('/history/:id', teacherController.contentById)
teacherRouter.post('/history/:id/export-pdf', teacherController.exportPdf)
teacherRouter.get('/subscription', teacherController.subscription)
teacherRouter.post('/telegram/link-code', teacherController.createTelegramLinkCode)
