import { WHITELIST_DOMAINS } from '~/utils/constants'
import { BusinessLogicError, ERROR_CODES } from '~/utils/error'
import { env } from '~/utils/environment'

/**
 * CORS (Cross-Origin Resource Sharing) configuration.
 *
 * origin: Defines which domains are allowed to access the API.
 *   - In non-production (development/test), all origins are allowed (e.g., for Postman testing).
 *   - In production, only origins in the WHITELIST_DOMAINS array are permitted.
 *     Requests from unlisted domains will be rejected with a BusinessLogicError.
 *
 * optionsSuccessStatus: Some legacy browsers (IE11, certain SmartTVs) don't handle HTTP 204 well,
 * so we return HTTP 200 for successful OPTIONS requests.
 *
 * credentials: Allows cookies and other credentials to be included in cross-origin requests.
 */
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins when not in production (for easier development/testing)
    if (env.BUILD_MODE !== 'production') {
      return callback(null, true)
    }

    // Allow only whitelisted domains in production
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // Reject requests from non-whitelisted domains
    return callback(
      new BusinessLogicError(
        ERROR_CODES.REQUEST_INVALID,
        `${origin} is not allowed by our CORS policy.`
      )
    )
  },

  // Use HTTP 200 for successful pre-flight OPTIONS requests
  optionsSuccessStatus: 200,

  // Enable cookies and authentication information in cross-origin requests
  credentials: true
}
