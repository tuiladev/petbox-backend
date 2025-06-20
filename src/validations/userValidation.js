import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import {
  ApiError,
  ValidationError,
  BusinessLogicError,
  ERROR_CODES
} from '~/utils/error'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  PHONE_RULE,
  USERNAME_RULE
} from '~/utils/validator'

/**
 * Middleware to validate user registration payload.
 * - Checks fullName, birthDate, email, phone, password/type.
 * - Logs start/end, and throws specific errors on invalid logic.
 */
export const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    fullName: Joi.string().min(5).max(30).trim().strict().required(),
    birthDate: Joi.date().required(),
    email: Joi.string().pattern(EMAIL_RULE).required(),
    phone: Joi.string().pattern(PHONE_RULE).required(),
    password: Joi.string().pattern(PASSWORD_RULE),
    key: Joi.string(), // Social login key (optional)
    type: Joi.string().valid('social', 'normal').required()
  })

  try {
    // Log the incoming registration request
    req.logger.info('User register validating payload', req.body)
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    const { key, type, password } = req.body
    // Social flow requires a valid key
    if (type === 'social' && !key) {
      throw new BusinessLogicError(
        ERROR_CODES.REQUEST_INVALID,
        'Missing social info key'
      )
    }
    // Normal flow requires a password
    if (type === 'normal' && !password) {
      throw new BusinessLogicError(
        ERROR_CODES.VALIDATION_MISSING_FIELD,
        'Password is required for normal registration'
      )
    }

    req.logger.info('User register validation passed')
    return next()
  } catch (err) {
    // Transform Joi errors into ValidationError
    if (err.isJoi) {
      req.logger.error('User register validation failed', err)
      return next(ValidationError.fromJoi(err))
    }
    // Pass through BusinessLogicError or ApiError
    return next(err)
  }
}

/**
 * Middleware to validate account verification payload.
 * - Checks email and token formats.
 */
export const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().pattern(EMAIL_RULE).required(),
    token: Joi.string().required()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    req.logger.info('Verify account payload valid', req.body)
    return next()
  } catch (err) {
    req.logger.error('Verify account validation failed', err)
    return next(ValidationError.fromJoi(err))
  }
}

/**
 * Middleware to validate login payload.
 * - Requires password and at least phone or username.
 */
export const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    phone: Joi.string().pattern(PHONE_RULE),
    username: Joi.string().min(5).max(20).pattern(USERNAME_RULE),
    password: Joi.string().pattern(PASSWORD_RULE).required()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    const { phone, username } = req.body
    if (!phone && !username) {
      req.logger.warn('Login validation failed: missing username or phone')
      throw new BusinessLogicError(
        ERROR_CODES.VALIDATION_MISSING_FIELD,
        'Username or phone is required'
      )
    }
    req.logger.info('Login payload valid', req.body)
    return next()
  } catch (err) {
    // Any validation or logic error
    req.logger.error('Login validation error', err)
    return next(
      err.isJoi
        ? ValidationError.fromJoi(err)
        : new BusinessLogicError(
            ERROR_CODES.USER_INVALID_CREDENTIALS,
            'Invalid username/phone or password'
          )
    )
  }
}

/**
 * Middleware to validate social login payload.
 * - Allows continuation if user_id and key provided.
 * - Otherwise checks provider, code, or authorization_code/codeVerifier.
 */
export const socialLogin = (req, res, next) => {
  req.logger.info('Social login validating payload', req.body)
  const { user_id, key, provider, code, authorization_code, codeVerifier } =
    req.body
  if (user_id && key) {
    req.logger.info('Social login: existing pending user flow')
    return next()
  }
  // Validate provider
  if (!['google', 'zalo'].includes(provider)) {
    req.logger.warn('Social login invalid provider', provider)
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        ERROR_CODES.REQUEST_INVALID,
        'Invalid social provider'
      )
    )
  }
  // Validate credentials for each provider
  if (
    (provider === 'google' && !code) ||
    (provider === 'zalo' && (!authorization_code || !codeVerifier))
  ) {
    req.logger.warn('Social login missing credentials for provider', provider)
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        ERROR_CODES.USER_INVALID_CREDENTIALS,
        'Invalid social credentials'
      )
    )
  }
  req.logger.info('Social login payload valid', {
    provider,
    code,
    authorization_code,
    codeVerifier
  })
  return next()
}

/**
 * Middleware to validate user profile update payload.
 * - Allows updating fullName, email, phone, password, newPassword.
 */
export const updateValidation = async (req, res, next) => {
  const correctCondition = Joi.object({
    fullName: Joi.string().min(5).max(30).trim(),
    email: Joi.string().pattern(EMAIL_RULE),
    phone: Joi.string().pattern(PHONE_RULE),
    password: Joi.string().pattern(PASSWORD_RULE),
    newPassword: Joi.string().pattern(PASSWORD_RULE)
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    req.logger.info('Update payload valid', req.body)
    return next()
  } catch (err) {
    req.logger.error('Update validation failed', err)
    return next(ValidationError.fromJoi(err))
  }
}

export const userValidation = {
  createNew,
  verifyAccount,
  login,
  socialLogin,
  update: updateValidation
}
