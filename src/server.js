// Logger
import { logger } from './config/logger.js'

// Server
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import { rateLimit } from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import AsyncExitHook from 'async-exit-hook'

// Config
import { corsOptions } from './config/cors.js'
import { env } from '~/utils/environment.js'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { globalErrorHandler } from '~/middlewares/errorHandlerMiddleware.js'

// Routes verion 1
import { APIs_V1 } from '~/routes/v1'

const CREATE_SERVER = () => {
  // Create app instance
  const app = express()

  // Header security set with Helmet
  app.use(helmet())

  // CORS config (allow postman to call api, localhost:5173, ...)
  app.use(cors(corsOptions))

  // Diable store cache with cache - control
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Improve loading speed by compressing response data with compression() method
  if (env.BUILD_MODE === 'production') {
    app.use(compression())
  }

  // Rate limiting with rateLimit from 'express-rate-limit'
  //    15 minutes: 100 request/client in production mode
  //                1000 request/client in development mode
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.BUILD_MODE === 'production' ? 100 : 1000,
    message: { error: 'RATE_LIMIT_EXCEEDED' }
  })
  app.use(limiter)

  // Cookie parser using 'cookie-parser'
  app.use(cookieParser())

  // Body parser using express.json()
  app.use(express.json())

  // Using api version '/v1'
  app.use('/v1', APIs_V1)

  // Set global error handler middleware
  app.use(globalErrorHandler)

  return app
}

const START_SERVER = async () => {
  try {
    logger.info('Starting application...')
    await CONNECT_DB()
    logger.info('Database connected successfully')

    const app = CREATE_SERVER()
    const port =
      env.BUILD_MODE === 'production'
        ? process.env.PORT
        : env.LOCAL_DEV_APP_PORT

    const host =
      env.BUILD_MODE === 'production' ? '0.0.0.0' : env.LOCAL_DEV_APP_HOST

    const server = app.listen(port, host, () => {
      const address =
        env.BUILD_MODE === 'production'
          ? `Port ${port}`
          : `http://${host}:${port}`

      logger.info(`🚀 Server is running at: ${address}`)
      logger.info(`📊 Environment: ${env.BUILD_MODE}`)
      logger.info(`🌐 Host: ${host}`)
    })

    server.on('error', error => {
      logger.error('❌ Server error:', error)
      process.exit(1)
    })

    // Graceful shutdown
    AsyncExitHook(async () => {
      logger.info('Shutting down gracefully...')
      server.close(() => {
        logger.info('HTTP server closed')
      })
      await CLOSE_DB()
      logger.info('Database connection closed')
    })

    return server
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

START_SERVER()
