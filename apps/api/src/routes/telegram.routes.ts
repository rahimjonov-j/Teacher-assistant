import { Router } from 'express'
import { telegramController } from '../controllers/telegram.controller.js'

export const telegramRouter = Router()

telegramRouter.get('/status', telegramController.status)
telegramRouter.post('/webhook', telegramController.webhook)
