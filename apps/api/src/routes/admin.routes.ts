import { Router } from 'express'
import { adminController } from '../controllers/admin.controller.js'
import { requireAdmin } from '../middleware/admin.js'
import { requireAuth } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)
adminRouter.get('/overview', adminController.overview)
adminRouter.get('/teachers', adminController.teachers)
adminRouter.get('/usage', adminController.usage)
adminRouter.get('/subscriptions', adminController.subscriptions)
adminRouter.get('/activity', adminController.activity)
