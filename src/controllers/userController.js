import ms from 'ms'
import { env } from '~/utils/environment'
import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

/**
 * Set access_token & refresh_token to cookies
 */
const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const commonOpts = { httpOnly: true, secure: true, sameSite: 'none' }
  res.cookie('accessToken', accessToken, {
    ...commonOpts,
    maxAge: ms(env.ACCESS_TOKEN_LIFE)
  })
  res.cookie('refreshToken', refreshToken, {
    ...commonOpts,
    maxAge: ms(env.REFRESH_TOKEN_LIFE)
  })
}

/**
 * Request controller for register new user account
 */
const createNew = async (req, res, next) => {
  try {
    const result = await userService.createNew(req.body)
    const { accessToken, refreshToken, ...payload } = result
    setAuthCookies(res, result)
    res.clearCookie('verifyToken')
    return res.status(StatusCodes.OK).json(payload)
  } catch (err) {
    next(err)
  }
}

/**
 * Request controller for login (with phone & password)
 */
const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)
    const { accessToken, refreshToken, ...payload } = result
    setAuthCookies(res, result)
    return res.status(StatusCodes.OK).json(payload)
  } catch (err) {
    next(err)
  }
}

/**
 * Request controller for social login
 */
const socialLogin = async (req, res, next) => {
  try {
    const result = await userService.socialLogin(req.body)
    const { accessToken, refreshToken, ...payload } = result

    return req.body.key
      ? res.status(StatusCodes.ACCEPTED).json(result)
      : (setAuthCookies(res, result), res.status(StatusCodes.OK).json(payload))
  } catch (err) {
    next(err)
  }
}

/**
 * Request controller for logout
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
 * Request controller for refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const tokens = await userService.refreshToken(req.cookies.refreshToken)
    setAuthCookies(res, tokens)
    return res.status(StatusCodes.OK).json(tokens)
  } catch (err) {
    next(err)
  }
}

/**
 * Request controller for update user info
 */
const update = async (req, res, next) => {
  try {
    const updatedUser = await userService.update(req.body)
    res.clearCookie('verifyToken')
    return res.status(StatusCodes.OK).json(updatedUser)
  } catch (err) {
    next(err)
  }
}

/**
 * Request controller for create OTP code
 */
const requestOtp = async (req, res, next) => {
  try {
    const result = await userService.requestOtp(req.body)
    return res.status(StatusCodes.OK).json(result)
  } catch (err) {
    return next(err)
  }
}

/**
 * Request controller for verify OTP code
 */
const verifyOtp = async (req, res, next) => {
  try {
    const verify_token = await userService.verifyOtp(req.body)
    res.cookie('verifyToken', verify_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(env.VERIFY_TOKEN_LIFE)
    })
    return res.status(StatusCodes.OK).json({ verified: true })
  } catch (err) {
    return next(err)
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
