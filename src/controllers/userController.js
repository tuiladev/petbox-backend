import ms from 'ms'
import { env } from '~/utils/environment'
import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

/**
 * Stores access and refresh tokens as HTTP-only, secure cookies.
 * - httpOnly: prevents client-side scripts from accessing the cookies.
 * - secure: ensures cookies are sent only over HTTPS.
 * - sameSite: 'none' allows cross-site requests.
 * - maxAge: controls cookie expiration based on configured lifetimes.
 */
const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const commonOpts = { httpOnly: true, secure: true, sameSite: 'none' }

  // Set access token cookie with configured lifetime
  res.cookie('accessToken', accessToken, {
    ...commonOpts,
    maxAge: ms(env.ACCESS_TOKEN_LIFE)
  })

  // Set refresh token cookie with configured lifetime
  res.cookie('refreshToken', refreshToken, {
    ...commonOpts,
    maxAge: ms(env.REFRESH_TOKEN_LIFE)
  })
}

/**
 * Handles user registration:
 * - Calls service to create a new account.
 * - Sets authentication cookies.
 * - Clears any existing verification token.
 * - Returns user payload (excluding tokens) on success.
 */
const createNew = async (req, res, next) => {
  try {
    const result = await userService.createNew(req.body)
    const { accessToken, refreshToken, ...user } = result

    // Store tokens in cookies
    setAuthCookies(res, { accessToken, refreshToken })

    // Clear verification cookie if present
    res.clearCookie('verifyToken')

    // Respond with user data only
    return res.status(StatusCodes.OK).json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * Authenticates user using phone and password:
 * - Calls service to validate credentials.
 * - Sets authentication cookies.
 * - Returns user payload on success.
 */
const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)
    const { accessToken, refreshToken, ...user } = result

    // Store tokens in cookies
    setAuthCookies(res, { accessToken, refreshToken })

    // Respond with user data
    return res.status(StatusCodes.OK).json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * Handles social login or account linking:
 * - Calls service for social authentication.
 * - If a temporary key is returned, responds with ACCEPTED and key.
 * - Otherwise sets cookies and returns user payload.
 */
const socialLogin = async (req, res, next) => {
  try {
    const result = await userService.socialLogin(req.body)

    // If a verify key is provided, return 202 for further steps
    if (result.key) {
      return res.status(StatusCodes.ACCEPTED).json(result)
    }

    // Otherwise set cookies and return user data
    const { accessToken, refreshToken, ...user } = result
    setAuthCookies(res, { accessToken, refreshToken })

    return res.status(StatusCodes.OK).json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * Clears authentication cookies to log the user out.
 */
const logout = (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (err) {
    next(err)
  }
}

/**
 * Issues new access and refresh tokens based on the refresh token cookie.
 * - Calls service to generate new tokens.
 * - Updates cookies with new values.
 */
const refreshToken = async (req, res, next) => {
  try {
    const tokens = await userService.refreshToken(req.cookies.refreshToken)

    // Update cookies with new tokens
    setAuthCookies(res, tokens)

    // Return new tokens in response body
    return res.status(StatusCodes.OK).json(tokens)
  } catch (err) {
    next(err)
  }
}

/**
 * Updates user profile information:
 * - Calls service to apply updates.
 * - Clears any existing verification token.
 * - Returns updated user data.
 */
const update = async (req, res, next) => {
  try {
    const updatedUser = await userService.update(req.body)

    // Remove verification token cookie after update
    res.clearCookie('verifyToken')

    return res.status(StatusCodes.OK).json(updatedUser)
  } catch (err) {
    next(err)
  }
}

/**
 * Generates an OTP for verification:
 * - Calls service to create OTP.
 * - Returns 202 if a new user_id is generated, otherwise 200.
 */
const requestOtp = async (req, res, next) => {
  try {
    const result = await userService.requestOtp(req.body)
    return res.status(StatusCodes.OK).json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * Verifies OTP code:
 * - Calls service to validate code.
 * - Sets a short-lived verification cookie on success.
 */
const verifyOtp = async (req, res, next) => {
  try {
    const verify_token = await userService.verifyOtp(req.body)

    // Store verification token in cookie
    res.cookie('verifyToken', verify_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(env.VERIFY_TOKEN_LIFE)
    })

    return res.status(StatusCodes.OK).json({ verified: true })
  } catch (err) {
    next(err)
  }
}

export const userController = {
  createNew,
  login,
  socialLogin,
  logout,
  refreshToken,
  update,
  requestOtp,
  verifyOtp
}
