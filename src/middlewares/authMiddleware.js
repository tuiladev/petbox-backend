import { StatusCodes } from 'http-status-codes'
import { logger } from '~/config/logger'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/utils/environment'
import { ERROR_CODES, ApiError, BusinessLogicError } from '~/utils/error'

/**
 * Middleware to check and validate the access token:
 * 1. Verifies presence of accessToken cookie.
 * 2. Decodes token to extract user phone.
 * 3. Handles expired tokens and other auth errors.
 */
export const isAuthorized = async (req, res, next) => {
  logger.info('Verify authentication token ....')
  // 1. Retrieve token from cookies
  const token = req.cookies?.accessToken
  if (!token) {
    // No token: user is unauthorized
    return next(
      new ApiError(
        StatusCodes.GONE,
        ERROR_CODES.USER_UNAUTHORIZED,
        'Unauthorized: token not found'
      )
    )
  }

  try {
    // 2. Verify token signature and extract payload
    const { phone } = await JwtProvider.verifyToken(
      token,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )
    // Attach user phone to request for downstream handlers
    req.body.phone = phone
    return next()
  } catch (err) {
    // 3a. Token expired: instruct client to refresh
    if (err.message?.includes('jwt expired')) {
      return next(
        new ApiError(
          StatusCodes.GONE,
          ERROR_CODES.TOKEN_EXPIRED,
          'Access token expired, please refresh'
        )
      )
    }
    // 3b. Any other token error: unauthorized
    return next(
      new ApiError(
        StatusCodes.GONE,
        ERROR_CODES.USER_UNAUTHORIZED,
        'Unauthorized: invalid token'
      )
    )
  }
}

/**
 * Middleware to check and validate the one-time verify token (OTP):
 * 1. Logs incoming request body for debugging.
 * 2. Verifies presence of verifyToken cookie.
 * 3. Decodes token to extract user phone.
 * 4. Handles expired tokens and instructs re-verification.
 */
export const isVerifyOTP = async (req, res, next) => {
  // 1. Log for tracing OTP flow
  logger.info('Starting OTP verification:', req.body)

  // 2. Retrieve verify token from cookies
  const token = req.cookies?.verifyToken
  if (!token) {
    return next(
      new ApiError(
        StatusCodes.GONE,
        ERROR_CODES.USER_UNAUTHORIZED,
        'Please verify OTP first'
      )
    )
  }

  try {
    // 3. Verify token signature and extract payload
    const { phone } = await JwtProvider.verifyToken(
      token,
      env.VERIFY_TOKEN_SECRET_SIGNATURE
    )
    // Overwrite verified phone to request
    req.body.phone = phone
    logger.info('OTP verification passed for phone:', phone)
    return next()
  } catch (err) {
    // 4. Expired verify token: prompt re-verification
    if (err.message?.includes('jwt expired')) {
      return next(
        new BusinessLogicError(
          ERROR_CODES.TOKEN_EXPIRED,
          'Verification session expired, please request OTP again'
        )
      )
    }
    // Other errors
    return next(err)
  }
}

export const authMiddleware = {
  isAuthorized,
  isVerifyOTP
}
