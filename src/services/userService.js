/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { ArgonProvider } from '~/providers/ArgonProvider'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { pickUser } from '~/utils/formatters'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

const createNew = async (reqBody) => {
  try {
    // Check if user_phone already exists
    const existUser = await userModel.findOneByPhone(reqBody.phoneNumber)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Số điện thoại đã tồn tại!')
    }

    // Create data to store
    const newUser = {
      fullName: reqBody.fullName,
      email: reqBody.email,
      phoneNumber: reqBody.phoneNumber,
      birthDate: reqBody.birthDate,
      gender: reqBody.gender,
      password: await ArgonProvider.hashPassword(reqBody.password)
    }

    // Store data to database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Return result to controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    // Query user in Database
    const existUser = await userModel.findOneByPhone(reqBody.phoneNumber)

    // Check if user_phoneNumber is not exists
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tồn tại !')

    // Check if password is not correct
    const isPasswordCorrect = await ArgonProvider.verifyPasswordWithHash(reqBody.password, existUser.password)
    if (!isPasswordCorrect) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Sai thông tin đăng nhập!')

    // Create payload data for token
    const userInfo = {
      _id: existUser._id,
      phoneNumber: existUser.phoneNumber
    }

    // Create 2 type of token: access token and refresh token
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    )
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    )

    // Return info to controller
    return {
      accessToken,
      refreshToken,
      ...pickUser(existUser)
    }
  }
  catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    // Verify refresh token
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    // Create payload data for token
    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }

    // Create new accessToken
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    )

    // Return to controller
    return { accessToken }
  }
  catch (error)
  {
    throw error
  }
}

const update = async (userId, reqBody) => {
  try {
    // Query user in Database
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tồn tại !')

    // Init updatedUser
    let updatedUser = {}

    // CASE 1: Change password
    if (reqBody.currentPassword && reqBody.newPassword) {
      // Check if current password is correct
      if (!await ArgonProvider.verifyPasswordWithHash(reqBody.currentPassword, existUser.password))
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Mật khẩu hiện tại không đúng!')

      // Hash new password
      updatedUser = await userModel.update(userId, { password: await ArgonProvider.hashPassword(reqBody.newPassword) })
    }
    // CASE 2: Update other info
    else {
      updatedUser = await userModel.update(userId, reqBody)
    }

    // Return to controller
    return pickUser(updatedUser)
  }
  catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  login,
  refreshToken,
  update
}