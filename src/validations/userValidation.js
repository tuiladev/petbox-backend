import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import {
  ApiError,
  ValidationError,
  BusinessLogicError,
  ERROR_CODES
} from '~/utils/apiError'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  PHONE_RULE,
  USERNAME_RULE
} from '~/utils/validator'

const createNew = async (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().min(5).max(30).trim().strict().required(),
    birthDate: Joi.date().required(),
    email: Joi.string().pattern(EMAIL_RULE).required(),
    phone: Joi.string().pattern(PHONE_RULE).required(),
    password: Joi.string().pattern(PASSWORD_RULE),

    key: Joi.string(), // optional
    type: Joi.string().valid('social', 'normal').required()
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })

    const { key, type, password } = req.body

    if (type === 'social' && !key) {
      throw new BusinessLogicError(
        ERROR_CODES.BAD_REQUEST,
        'Required your social info key'
      )
    }

    if (type === 'normal' && !password) {
      throw new BusinessLogicError(
        ERROR_CODES.VALIDATION_MISSING_FIELD,
        'Required a password for register'
      )
    }

    next()
  } catch (err) {
    if (err instanceof Joi.ValidationError) {
      return next(ValidationError.fromJoi(err))
    }
    return next(err)
  }
}

const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().pattern(EMAIL_RULE).required(),
    token: Joi.token().required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ValidationError.fromJoi(error))
  }
}

const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    phone: Joi.string().pattern(PHONE_RULE),
    username: Joi.string().min(5).max(20).pattern(USERNAME_RULE),
    password: Joi.string().pattern(PASSWORD_RULE).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    if (!req.body.username && !req.body.phone) {
      next(
        new BusinessLogicError(
          ERROR_CODES.VALIDATION_MISSING_FIELD,
          'Required username or phone!'
        )
      )
    }
    next()
  } catch (error) {
    next(
      new BusinessLogicError(
        ERROR_CODES.USER_INVALID_CREDENTIALS,
        'Your phone/ username or password is incorect!'
      )
    )
  }
}

export const socialLogin = (req, res, next) => {
  const { provider, code, authorization_code, codeVerifier } = req.body

  if (provider !== 'google' && provider !== 'zalo') {
    next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        ERROR_CODES.REQUEST_INVALID,
        'Your request is invalid!'
      )
    )
  }

  if (
    (provider === 'google' && !code) ||
    (provider === 'zalo' && (!authorization_code || !codeVerifier))
  ) {
    next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        ERROR_CODES.USER_INVALID_CREDENTIALS,
        'Invalid Credentials!'
      )
    )
  }
  next()
}

const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    fullName: Joi.string().min(5).max(30).trim(),
    email: Joi.string().pattern(EMAIL_RULE),
    phone: Joi.string().pattern(PHONE_RULE),
    password: Joi.string().pattern(PASSWORD_RULE),
    newPassword: Joi.string().pattern(PASSWORD_RULE)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ValidationError.fromJoi(error))
  }
}

export const userValidation = {
  createNew,
  verifyAccount,
  login,
  socialLogin,
  update
}
