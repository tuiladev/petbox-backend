/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { ArgonProvider } from '~/providers/ArgonProvider'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

const createNew = async (reqBody) => {
  try {
    // Check if user_email already exists
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại!')
    }

    // Create data to store
    const newUser = {
      fullName: reqBody.fullName,
      email: reqBody.email,
      phoneNumber: reqBody.phoneNumber,
      password: await ArgonProvider.hashPassword(reqBody.password),
      verifyToken: uuidv4()
    }

    // Store data to database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Verify email using Brevo
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'Xác thực tài khoản email'
    const htmlContent = `
      <h2>Hãy xác thực tài khoản email của bạn !</h2>
      <p>Nhấn <a href="${verificationLink}">vào đây</a> để xác thực email</p>
      <h2>Trân trọng, <br/> - The Pet's Box - Phòng Khám Thú Y Thủ Đức</h2>
    `

    // Call provider brevo to send mail
    await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent)

    // Return result to controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    // Query user in Database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Check if user_email is not exists
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Email not found!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Email already verified!')
    if (existUser.verifyToken !== reqBody.token) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is not valid!')

    // Update user to active
    const updateData = {
      isActive: true,
      verifyToken: null
    }

    // Update user in Database
    const updatedUser = await userModel.update(existUser._id, updateData)
    return pickUser(updatedUser)
  }
  catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    // Query user in Database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Check if user_email is not exists
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Email không tồn tại !')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Email chưa được xác minh!')

    // Check if password is not correct
    const isPasswordCorrect = await ArgonProvider.verifyPasswordWithHash(reqBody.password, existUser.password)
    if (!isPasswordCorrect) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Sai thông tin đăng nhập!')

    // Create payload data for token
    const userInfo = {
      _id: existUser._id,
      email: existUser.email
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

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken
}
