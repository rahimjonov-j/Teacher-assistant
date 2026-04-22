import type { Request, Response } from 'express'
import { plansRepository } from '../repositories/plans.repository.js'
import { asyncHandler } from '../utils/async-handler.js'

export const plansController = {
  list: asyncHandler(async (_request: Request, response: Response) => {
    const plans = await plansRepository.listAll()
    response.json({ plans })
  }),
}
