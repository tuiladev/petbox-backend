import ms from 'ms'
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) {
    next(error)
  }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  }
  catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    // Return Http only cookies to client
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(env.ACCESS_TOKEN_LIFE + env.BUFFER_TIME)
    })
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(env.REFRESH_TOKEN_LIFE + env.BUFFER_TIME)
    })

    // Remove token from res.body
    const { accessToken, refreshToken, ...userInfo } = result
    res.status(StatusCodes.OK).json(userInfo)
  }
  catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    // Return loggedOut: true to client
    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    // Call serviec to generate new access token
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    // Return new Http only cookies to client
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(env.ACCESS_TOKEN_LIFE) + env.BUFFER_TIME
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please Sign In! (Error from refresh Token)'))
  }
}

const update = async (req, res, next) => {
  try {
    const userId = req.JwtDecoded._id
    const updatedUser = await userService.update(userId, req.body)
    res.status(StatusCodes.OK).json(updatedUser)
  }
  catch (error) {
    next(error)
  }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken,
  update
}
