import { Router } from 'express'
import { plansController } from '../controllers/plans.controller.js'

export const plansRouter = Router()

plansRouter.get('/', plansController.list)
