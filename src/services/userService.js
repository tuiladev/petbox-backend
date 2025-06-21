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
import { logger } from '~/config/logger'

/**
 * Generate both access and refresh JWT tokens for a user.
 * @param {Object} userInfo - Minimal user payload (e.g., {_id, phone}).
 */
const generateTokens = async userInfo => {
  logger.info('Generating tokens for user:', userInfo)
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
  logger.info('Tokens generated successfully')
  return { accessToken, refreshToken }
}

/**
 * Build authentication response with tokens and sanitized user info.
 * @param {Object} user - Full user document from DB.
 */
const buildAuthResponse = async user => {
  logger.info('Building auth response for user:', user._id)
  const payload = { _id: user._id, phone: user.phone }
  const tokens = await generateTokens(payload)
  const userData = pickUser(user)
  logger.info('Auth response built')
  return { ...tokens, ...userData }
}

/**
 * Retrieve and parse social login info from Redis using a pending key.
 * @param {string} key - Redis key storing social login data.
 */
const getRedisSocialInfo = async key => {
  logger.info(`Retrieving social info from Redis for key: ${key}`)
  const data = await RedisProvider.getObject(key)
  if (!data) {
    logger.warn('No social info found for key:', key)
    throw new BusinessLogicError(
      ERROR_CODES.TOKEN_EXPIRED,
      'Social login key invalid or expired'
    )
  }
  const { provider, socialId, avatar, email } = data
  logger.info('Social info retrieved:', { provider, socialId })
  return { email, avatar, socialIds: [{ provider, id: socialId }] }
}

/**
 * Create new user in 2 case: with social account & with phone number
 */
export const createNew = async data => {
  logger.info('userService.createNew called with data:', data)
  const { type, key, ...userData } = data

  // Check for existing account
  const existsUser = userData.userName
    ? await userModel.findOneByUserName(userData.userName)
    : await userModel.findOneByPhone(userData.phone)

  // Handle social registration: merge Redis info
  if (type === 'social' && key) {
    const socialInfo = await getRedisSocialInfo(key)
    if (existsUser) {
      const updatedUser = await userModel.update(existsUser.user_id, socialInfo)
      return buildAuthResponse(updatedUser)
    }
    Object.assign(userData, socialInfo)
    logger.info('Merged social info into registration data')
  }

  if (existsUser) {
    logger.warn('Attempt to register existing user:', existsUser._id)
    throw new BusinessLogicError(
      ERROR_CODES.USER_ALREADY_EXISTS,
      'Account already exists'
    )
  }

  // Hash password for normal registration
  if (type === 'normal' && userData.password) {
    logger.info('Hashing password for new user')
    userData.password = await ArgonProvider.hashPassword(userData.password)
  }

  // Insert new user and fetch full document
  const { insertedId } = await userModel.createNew(userData)
  const newUser = await userModel.findOneById(insertedId)
  logger.info('New user created with id:', insertedId)

  // Return authentication payload
  return buildAuthResponse(newUser)
}

/**
 * Authenticate user using phone and password.
 */
export const login = async ({ phone, password }) => {
  logger.info(`userService.login called for phone: ${phone}`)
  const user = await userModel.findOneByPhone(phone)
  if (!user) {
    logger.warn('Login failed: user not found for phone', phone)
    throw new BusinessLogicError(
      ERROR_CODES.USER_NOT_FOUND,
      'Account not found'
    )
  }
  const valid = await ArgonProvider.verifyPasswordWithHash(
    password,
    user.password
  )
  if (!valid) {
    logger.warn('Login failed: invalid credentials for user', user._id)
    throw new BusinessLogicError(
      ERROR_CODES.USER_INVALID_CREDENTIALS,
      'Invalid credentials'
    )
  }
  logger.info('User authenticated successfully:', user._id)
  return buildAuthResponse(user)
}

/**
 * Custom social login with social id
 */
const socialLogin = async data => {
  logger.info('userService.socialLogin called with data:', data)

  // Exchange code and fetch user info
  logger.info('Exchanging social code for provider tokens')
  const { provider, code, authorization_code, codeVerifier } = data
  const tokenData =
    provider === 'google'
      ? await GoogleProvider.exchangeCodeForToken(code)
      : await ZaloProvider.exchangeCodeForToken({
          authorization_code,
          codeVerifier
        })

  logger.info('Fetching social user info from provider')
  const userData =
    provider === 'google'
      ? await GoogleProvider.getUserInfo(tokenData.access_token)
      : await ZaloProvider.getUserInfo(
          tokenData.access_token,
          tokenData.refresh_token
        )

  const socialId = provider === 'google' ? userData.sub : userData.id
  const existing = await userModel.findOneBySocialId(provider, socialId)
  if (existing) {
    logger.info('Social user found, generating tokens for:', existing._id)
    return buildAuthResponse(existing)
  }

  // New social user: create pending key
  logger.warn('No social user found, creating pending Redis key')
  const key = `social:pending:${provider}:${socialId}`
  const info = {
    provider,
    socialId,
    avatar: userData.picture || userData.avatar,
    email: userData.email || ''
  }
  await RedisProvider.set(
    key,
    JSON.stringify(info),
    ms(env.VERIFY_TOKEN_LIFE) / 1000
  )
  logger.info(`Pending social key created: ${key}`)
  const name =
    userData.name || [userData.family_name, userData.given_name].join(' ')
  return { key, name, email: info.email }
}

/**
 * Refresh JWT tokens using a valid refresh token.
 */
export const refreshToken = async refreshToken => {
  logger.info('userService.refreshToken called')
  const decoded = await JwtProvider.verifyToken(
    refreshToken,
    env.REFRESH_TOKEN_SECRET_SIGNATURE
  )
  const tokens = await generateTokens({
    _id: decoded._id,
    phone: decoded.phone
  })
  logger.info('Tokens refreshed successfully')
  return tokens
}

/**
 * Update user profile or password based on provided data.
 */
const update = async data => {
  logger.info('userService.update called with data:', data)
  const user = data.phone
    ? await userModel.findOneByPhone(data.phone)
    : await userModel.findOneById(data.user_id)

  if (!user) {
    logger.warn(`Update failed: user not found for phone ${data.phone}`)
    throw new BusinessLogicError(
      ERROR_CODES.USER_NOT_FOUND,
      'Account not found'
    )
  }

  let updated

  // Handle password change
  if (data.currentPassword && data.newPassword) {
    const match = await ArgonProvider.verifyPasswordWithHash(
      data.currentPassword,
      user.password
    )
    if (!match) {
      logger.warn(
        `Update failed: incorrect current password for user ${user._id}`
      )
      throw new BusinessLogicError(
        ERROR_CODES.USER_INVALID_CREDENTIALS,
        'Incorrect current password'
      )
    }
  }

  // Apply update (password or other fields)
  if (data.newPassword) {
    logger.info(`Hashing new password for user:${user._id}`)
    updated = await userModel.update(user._id, {
      password: await ArgonProvider.hashPassword(data.newPassword)
    })
  } else {
    logger.info(`Updating user fields for: ${user._id}`)
    updated = await userModel.update(user._id, data)
  }

  logger.info(`User updated successfully: ${updated._id}`)
  return pickUser(updated)
}

/**
 * Create and send OTP code, enforcing rate limits.
 */
export const requestOtp = async ({ phone, actionType }) => {
  logger.info(
    `userService.requestOtp called for ${phone}, action: ${actionType}`
  )
  const user = await userModel.findOneByPhone(phone)
  // Registration flow
  if (actionType === 'register' && user) {
    logger.warn(`OTP register attempt for existing user: ${phone}`)
    throw new BusinessLogicError(
      ERROR_CODES.USER_ALREADY_EXISTS,
      'The phone number already exists'
    )
  }
  // Reset-password flow
  if (actionType === 'reset-password' && !user) {
    logger.warn(`OTP reset attempt for non-existent user: ${phone}`)
    throw new BusinessLogicError(
      ERROR_CODES.USER_NOT_FOUND,
      'The account does not exist'
    )
  }
  // Rate limit checks
  const key10min = `otp_counter:${phone}`
  const count10min = parseInt(await RedisProvider.getNumber(key10min), 10)
  if (count10min >= env.REDIS_MAX_PER_10MIN) {
    logger.warn(`OTP request limit exceeded (10min) for: ${phone}`)
    throw new BusinessLogicError(
      ERROR_CODES.REQUEST_EXCEED_ALLOWED,
      'Too many OTP requests, try again in 10 minutes'
    )
  }
  const keyDay = `otp_daily_counter:${phone}`
  const countDay = parseInt(await RedisProvider.getNumber(keyDay), 10)
  if (countDay >= env.REDIS_MAX_PER_DAY) {
    logger.warn(`OTP request limit exceeded (daily) for: ${phone}`)
    throw new BusinessLogicError(
      ERROR_CODES.REQUEST_EXCEED_ALLOWED,
      'Too many OTPs today, try again tomorrow'
    )
  }
  // Increment counters and set expirations
  const newCount10min = await RedisProvider.incr(key10min)
  if (newCount10min === 1)
    await RedisProvider.expire(key10min, ms(env.REDIS_WINDOW_10MIN) / 1000)
  const newCountDay = await RedisProvider.incr(keyDay)
  if (newCountDay === 1)
    await RedisProvider.expire(keyDay, ms(env.REDIS_WINDOW_1DAY) / 1000)

  // Send OTP via Twilio
  await TwilioProvider.sendVerification(phone)
  logger.info(`OTP code sent to: ${phone}`)
  return { counter: newCount10min }
}

/**
 * Verify OTP code and issue verification token.
 */
export const verifyOtp = async ({ phone, code }) => {
  logger.info(`userService.verifyOtp called for phone: ${phone}`)
  const result = await TwilioProvider.checkVerification(phone, code)
  if (result.status === 'pending') {
    logger.warn(`OTP verification failed for phone: ${phone}`)
    throw new BusinessLogicError(ERROR_CODES.OTP_INVALID, 'Invalid OTP code')
  }
  if (result.status === 'approved') {
    logger.info(`OTP verified successfully for phone: ${phone}`)
    return JwtProvider.generateToken(
      { phone },
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
