import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

const isAuthorized = async (req, res, next) => {
  // Take accessToken
  const clientAccessToken = req.cookies?.accessToken

  // Check accessToken
  if (!clientAccessToken) {
    next(
      new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized (token not found)')
    )
    return
  }

  try {
    // Verify accessToken
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )

    // Return phoneNumber for searching...
    req.phoneNumber = accessTokenDecoded.phoneNumber
    next()
  } catch (error) {
    // Access token is exprired
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
      return
    }

    // Another error, return to frontend and logout
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }
}

const isVerifyOTP = async (req, res, next) => {
  try {
    const verifyToken = req.cookies?.verifyToken
    if (!verifyToken)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Vui lòng xác thực OTP')

    const decoded = await JwtProvider.verifyToken(
      verifyToken,
      env.VERIFY_TOKEN_SECRET_SIGNATURE
    )
    req.phoneNumber = decoded.phoneNumber
    next()
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        'Phiên xác thực đã hết hạn, vui lòng thực hiện lại'
      )
    )
  }
}

export const authMiddleware = {
  isAuthorized,
  isVerifyOTP
}
