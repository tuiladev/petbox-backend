import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/utils/environment'
import { ERROR_CODES, ApiError } from '~/utils/apiError'

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
    return
  }

  try {
    // Verify accessToken
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )

    // Return phone for searching...
    req.phone = accessTokenDecoded.phone
    next()
  } catch (error) {
    // Access token is exprired
    if (error?.message?.includes('jwt expired')) {
      next(
        new ApiError(
          StatusCodes.GONE,
          ERROR_CODES.TOKEN_EXPRIRED,
          'Need to refresh token'
        )
      )
      return
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
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        ERROR_CODES.USER_UNAUTHORIZED,
        'Please verify otp first!'
      )

    const decoded = await JwtProvider.verifyToken(
      verifyToken,
      env.VERIFY_TOKEN_SECRET_SIGNATURE
    )

    // ensure user have register with a verify phone number
    req.body.phone = decoded.phone
    next()
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        ERROR_CODES.TOKEN_EXPRIRED,
        'Section is exprired, please try again!'
      )
    )
  }
}

export const authMiddleware = {
  isAuthorized,
  isVerifyOTP
}
