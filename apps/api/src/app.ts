import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { adminRouter } from './routes/admin.routes.js'
import { authRouter } from './routes/auth.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { teacherRouter } from './routes/teacher.routes.js'
import { telegramRouter } from './routes/telegram.routes.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true,
    }),
  )
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

  app.get('/', (_request, response) => {
    response.json({
      name: 'Teacher Assistant API',
      version: '0.1.0',
    })
  })

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/teacher', teacherRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/telegram', telegramRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
