import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.get('/me', requireAuth, authController.me)
authRouter.patch('/profile', requireAuth, authController.updateProfile)
