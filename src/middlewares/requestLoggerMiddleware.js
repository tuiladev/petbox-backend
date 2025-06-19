import { logger } from '~/config/logger.js'
import { env } from '~/utils/environment'
import { v4 as uuidv4 } from 'uuid'

/**
 * Init logger for any HTTP request
 * @param {String} serviceName - Service/Domain name to specific log
 */
export const requestLogger = serviceName => {
  return (req, res, next) => {
    // Create or take correlationId
    const correlationId = req.headers['x-correlation-id'] || uuidv4()
    req.correlationId = correlationId
    res.set('X-Correlation-ID', correlationId)

    // Create child logger with specific metadata and correlationId
    req.logger = logger.child({
      service: serviceName,
      environment: env.BUILD_MODE,
      version: process.env.npm_package_version || '1.0.0',
      correlationId,
      api: `${req.method} ${req.originalUrl}`
    })

    // Log request
    req.logger.info('Request received')
    next()
  }
}
