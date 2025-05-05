import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

const isAuthorized = async (req, res, next) => {
  // Take accessToken
  const clientAccessToken = req.cookies?.accessToken

  // Check accessToken
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized (token not found)'))
    return
  }

  try {
    // Verify accessToken
    const accessTokenDecoded = await JwtProvider.
      verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)

    // Set token to user
    req.JwtDecoded = accessTokenDecoded

    // Route to validation layer
    next()
  }
  catch (error) {
    // Access token is exprired
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
      return
    }

    // Another error, return to frontend and logout
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }
}

export const authMiddleware = {
  isAuthorized
}