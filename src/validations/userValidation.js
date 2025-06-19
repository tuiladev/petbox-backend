import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import { ApiError, ValidationError, ERROR_CODES } from '~/utils/apiError'
import { EMAIL_RULE, PASSWORD_RULE, PHONE_RULE } from '~/utils/validator'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    fullName: Joi.string().required().min(5).max(30).trim().strict(),
    birthDate: Joi.date().required(),
    email: Joi.string().required().pattern(EMAIL_RULE),
    phone: Joi.string().required().pattern(PHONE_RULE),
    password: Joi.string().required().pattern(PASSWORD_RULE)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    return next(new ValidationError.fromJoi(error))
  }
}

const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE),
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
    phone: Joi.string().required().pattern(PHONE_RULE),
    password: Joi.string().required().pattern(PASSWORD_RULE)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(next(new ValidationError.fromJoi(error)))
  }
}

export const socialLogin = (req, res, next) => {
  const { provider, code, authorization_code, codeVerifier } = req.body

  if (provider !== 'google' && provider !== 'zalo') {
    return next(
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
    return next(
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
