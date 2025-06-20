import { WHITELIST_DOMAINS } from '~/utils/constants'
import { env } from '~/utils/environment'
import { BusinessLogicError, ERROR_CODES } from '~/utils/apiError.js'

/**
 * Cross origin resource sharing
 */
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow postman to call api in development environment
    if (env.BUILD_MODE !== 'production') {
      return callback(null, true)
    }

    // Check valid domain
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // Throw error if invalid domain
    return callback(
      new BusinessLogicError(
        ERROR_CODES.REQUEST_INVALID,
        `${origin} not allowed by our CORS Policy.`
      )
    )
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200,

  // CORS allow receive cookies from request
  credentials: true
}
