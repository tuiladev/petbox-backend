/* eslint-disable indent */
import ms from 'ms'
import { env } from '~/utils/environment'
import { ApiError, BusinessLogicError, ERROR_CODES } from '~/utils/error'
import { pickUser } from '~/utils/formatters'
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import { ArgonProvider } from '~/providers/ArgonProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { GoogleProvider } from '~/providers/GoogleProvider'
import { ZaloProvider } from '~/providers/ZaloProvider'
import { TwilioProvider } from '~/providers/TwilioProvider'
import { RedisProvider } from '~/providers/RedisProvider'

const generateTokens = async userInfo => ({
  accessToken: await JwtProvider.generateToken(
    userInfo,
    env.ACCESS_TOKEN_SECRET_SIGNATURE,
    env.ACCESS_TOKEN_LIFE
  ),
  refreshToken: await JwtProvider.generateToken(
    userInfo,
    env.REFRESH_TOKEN_SECRET_SIGNATURE,
    env.REFRESH_TOKEN_LIFE
  )
})

const createNew = async data => {
  // Get redis data if register with soical account
  if (data.key && data.type === 'social') {
    const redisData = await RedisProvider.get(data.key)
    if (!redisData)
      throw new BusinessLogicError(
        ERROR_CODES.TOKEN_EXPIRED,
        'Your social login key is invalid or expired!'
      )

    const { provider, socialId, avatar, email } = JSON.parse(redisData)

    data.email = email
    data.avatar = avatar
    data.socialIds = [{ provider, id: socialId }]
  }

  // Check if user is already exists
  const exists = data.userName
    ? await userModel.findOneByUserName(data.userName)
    : await userModel.findOneByPhone(data.phone)

  if (exists) {
    throw new BusinessLogicError(
      ERROR_CODES.USER_ALREADY_EXISTS,
      'The account already exists!'
    )
  }

  // Hash password in case register with normal flow
  if (data.password && data.type === 'normal') {
    data.password = await ArgonProvider.hashPassword(data.password)
  }

  // Create new user
  const { insertedId } = await userModel.createNew(data)
  const user = await userModel.findOneById(insertedId)

  // Generate token
  const payload = { _id: user._id, phone: user.phone }
  const tokens = await generateTokens(payload)
  return { ...tokens, ...pickUser(user) }
}

const login = async ({ phone, password }) => {
  const user = await userModel.findOneByPhone(phone)
  if (!user)
    throw new BusinessLogicError(
      ERROR_CODES.USER_NOT_FOUND,
      'Account not found'
    )
  const valid = await ArgonProvider.verifyPasswordWithHash(
    password,
    user.password
  )
  if (!valid)
    throw new BusinessLogicError(
      ERROR_CODES.USER_INVALID_CREDENTIALS,
      'Invalid credentials'
    )

  const payload = { _id: user._id, phone: user.phone }
  const tokens = await generateTokens(payload)
  return { ...tokens, ...pickUser(user) }
}

const socialLogin = async ({
  provider,
  code,
  authorization_code,
  codeVerifier
}) => {
  // Exchange code for tokens
  const tokenData =
    provider === 'google'
      ? await GoogleProvider.exchangeCodeForToken(code)
      : await ZaloProvider.exchangeCodeForToken({
          authorization_code,
          codeVerifier
        })

  // Get user info
  const userData =
    provider === 'google'
      ? await GoogleProvider.getUserInfo(tokenData.access_token)
      : await ZaloProvider.getUserInfo(
          tokenData.access_token,
          tokenData.refresh_token
        )

  const socialId = provider === 'google' ? userData.sub : userData.id
  const user = await userModel.findOneBySocialId(provider, socialId)

  // If user is already exists just return token
  if (user) {
    const payload = { _id: user._id, phone: user.phone }
    const tokens = await generateTokens(payload)
    return { ...tokens, ...pickUser(user) }
  } else {
    // User not found -> Store temp info to redis
    const key = `social:pending:${provider}:${socialId}`
    const name = userData.name
    const email = userData.email || ''
    const avatar = userData.picture || userData.avatar
    const info = { provider, socialId, avatar, email }

    // TTL 10 minutes
    await RedisProvider.set(key, JSON.stringify(info), env.VERIFY_TOKEN_LIFE)

    // Return to client
    return { key, name, email }
  }
}

const refreshToken = async refreshToken => {
  const decoded = await JwtProvider.verifyToken(
    refreshToken,
    env.REFRESH_TOKEN_SECRET_SIGNATURE
  )
  const tokens = await generateTokens({
    _id: decoded._id,
    phone: decoded.phone
  })
  return tokens
}

const update = async data => {
  const user = await userModel.findOneByPhone(data.phone)
  const userId = user._id
  if (!user)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
      'Account not found'
    )

  let updated

  // Check if user change password
  if (data.currentPassword && data.newPassword) {
    const same = await ArgonProvider.verifyPasswordWithHash(
      data.currentPassword,
      user.password
    )
    if (!same)
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        ERROR_CODES.USER_INVALID_CREDENTIALS,
        'Incorrect current password'
      )
  }

  // Check if user reset password
  if (data.newPassword) {
    updated = await userModel.update(userId, {
      password: await ArgonProvider.hashPassword(data.newPassword)
    })
  } else {
    // Update normal info
    updated = await userModel.update(userId, data)
  }

  return pickUser(updated)
}

const requestOtp = async ({ phone, actionType }) => {
  // Check if is a valid request
  const user = await userModel.findOneByPhone(phone)

  if (actionType === 'register') {
    if (user)
      throw new ApiError(
        StatusCodes.CONFLICT,
        ERROR_CODES.USER_ALREADY_EXISTS,
        'The phone number is already exists!'
      )
  } else if (actionType === 'reset-password') {
    if (!user)
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
        'The account is not exists!'
      )
  } else {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ERROR_CODES.REQUEST_INVALID,
      'Your request is invalid!'
    )
  }

  // Check OTP request limit
  const key10min = `otp_counter:${phone}`
  const count10min = parseInt((await RedisProvider.get(key10min)) || '0', 10)
  if (count10min >= env.REDIS_MAX_PER_10MIN) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      ERROR_CODES.REQUEST_EXCEED_ALLOWED,
      'You have requested OTP code more times than allowed, please try again in 10 minutes!'
    )
  }

  const keyDay = `otp_daily_counter:${phone}`
  const countDay = parseInt((await RedisProvider.get(keyDay)) || '0', 10)
  if (countDay >= env.REDIS_MAX_PER_DAY) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      ERROR_CODES.REQUEST_EXCEED_ALLOWED,
      'You have sent too many OTPs in a day, please try again tomorrow!'
    )
  }

  // If valid request and in accept limit -> create OTP
  const newCount10min = await RedisProvider.incr(key10min)
  if (newCount10min === 1)
    await RedisProvider.expire(key10min, ms(env.REDIS_WINDOW_10MIN) / 1000)
  const newCountDay = await RedisProvider.incr(keyDay)
  if (newCountDay === 1)
    await RedisProvider.expire(keyDay, ms(env.REDIS_WINDOW_1DAY) / 1000)

  await TwilioProvider.sendVerification(phone)
  return { counter: newCount10min }
}

const verifyOtp = async ({ phone, code }) => {
  const result = await TwilioProvider.checkVerification(phone, code)
  if (result.status === 'pending') {
    throw new BusinessLogicError(
      ERROR_CODES.OTP_INVALID,
      'Invalid OTP code. Please try again!'
    )
  }
  if (result.status === 'approved') {
    const payload = { phone }
    return await JwtProvider.generateToken(
      payload,
      env.VERIFY_TOKEN_SECRET_SIGNATURE,
      env.VERIFY_TOKEN_LIFE
    )
  }
}

export const userService = {
  createNew,
  login,
  socialLogin,
  refreshToken,
  update,
  requestOtp,
  verifyOtp
}
