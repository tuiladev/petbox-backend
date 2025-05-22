import ms from 'ms'
import ApiError from '~/utils/ApiError'
import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const commonOpts = { httpOnly: true, secure: true, sameSite: 'none' }
  res.cookie('accessToken', accessToken, {
    ...commonOpts,
    maxAge: ms(env.ACCESS_TOKEN_LIFE) + ms(env.BUFFER_TIME)
  })
  res.cookie('refreshToken', refreshToken, {
    ...commonOpts,
    maxAge: ms(env.REFRESH_TOKEN_LIFE) + ms(env.BUFFER_TIME)
  })
}

const createNew = async (req, res, next) => {
  try {
    const user = await userService.createNew(req.body)
    res.clearCookie('verifyToken')
    res.status(StatusCodes.CREATED).json(user)
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)
    setAuthCookies(res, result)
    const { accessToken, refreshToken, ...payload } = result
    res.status(StatusCodes.OK).json(payload)
  } catch (err) {
    next(err)
  }
}

const socialLogin = async (req, res, next) => {
  try {
    const result = await userService.socialLogin(req.body)
    setAuthCookies(res, result)
    const { accessToken, refreshToken, ...payload } = result
    res.status(StatusCodes.OK).json(payload)
  } catch (err) {
    next(err)
  }
}

const logout = (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (err) {
    next(err)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const tokens = await userService.refreshToken(req.cookies.refreshToken)
    setAuthCookies(res, tokens)
    res.status(StatusCodes.OK).json(tokens)
  } catch (err) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please sign in'))
  }
}

const update = async (req, res, next) => {
  try {
    const updatedUser = await userService.update(req.phoneNumber, req.body)
    res.clearCookie('verifyToken')
    res.status(StatusCodes.OK).json(updatedUser)
  } catch (err) {
    next(err)
  }
}

const requestOtp = async (req, res, next) => {
  try {
    const result = await userService.requestOtp(req.body)
    return res.status(StatusCodes.OK).json(result)
  } catch (err) {
    return next(err)
  }
}

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
