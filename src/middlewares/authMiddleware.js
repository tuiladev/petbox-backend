import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/utils/environment'
import { ERROR_CODES, ApiError, BusinessLogicError } from '~/utils/apiError'

/**
 * Ensure user is authorized before access
 */
const isAuthorized = async (req, res, next) => {
  // Take accessToken
  const clientAccessToken = req.cookies?.accessToken

  // Check accessToken
  if (!clientAccessToken) {
    next(
      new ApiError(
        StatusCodes.UNAUTHORIZED,
        ERROR_CODES.USER_UNAUTHORIZED,
        'Unauthorized (token not found)'
      )
    )
  }

  try {
    // Verify accessToken
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )

    // Return phone for searching...
    req.body.phone = accessTokenDecoded.phone
    next()
  } catch (error) {
    // Access token is EXPIRED
    if (error?.message?.includes('jwt expired')) {
      next(
        new ApiError(
          StatusCodes.GONE,
          ERROR_CODES.TOKEN_EXPIRED,
          'Need to refresh token'
        )
      )
    }

    // Another error, return to frontend and logout
    next(
      new ApiError(
        StatusCodes.UNAUTHORIZED,
        ERROR_CODES.USER_UNAUTHORIZED,
        'Unauthorized'
      )
    )
  }
}

/**
 * Check user is already verify phone number via OTP
 */
const isVerifyOTP = async (req, res, next) => {
  try {
    const verifyToken = req.cookies?.verifyToken
    if (!verifyToken)
      next(
        new BusinessLogicError(
          ERROR_CODES.USER_UNAUTHORIZED,
          'Please verify otp first!'
        )
      )

    const verifyTokenDecoded = await JwtProvider.verifyToken(
      verifyToken,
      env.VERIFY_TOKEN_SECRET_SIGNATURE
    )

    // Ensure user have register with a verify phone number
    req.body.phone = verifyTokenDecoded.phone
    next()
  } catch (error) {
    if (error?.message?.includes('jwt expired')) {
      next(
        new BusinessLogicError(
          ERROR_CODES.TOKEN_EXPIRED,
          'Section is EXPIRED, please try again!'
        )
      )
    }
  }
}

export const authMiddleware = {
  isAuthorized,
  isVerifyOTP
}
