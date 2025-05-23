import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
  PHONE_RULE,
  PHONE_RULE_MESSAGE
} from '~/utils/validator'

const createNew = async (req, res, next) => {
  if (req.phoneNumber) req.body.phoneNumber = req.phoneNumber
  const correctCondition = Joi.object({
    fullName: Joi.string().required().min(5).max(30).trim().strict(),
    birthDate: Joi.date().required(),
    gender: Joi.string().required().valid('male', 'female', 'other'),
    email: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    phoneNumber: Joi.string()
      .required()
      .pattern(PHONE_RULE)
      .message(PHONE_RULE_MESSAGE),
    password: Joi.string()
      .required()
      .pattern(PASSWORD_RULE)
      .message(PASSWORD_RULE_MESSAGE)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    token: Joi.string().required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    phoneNumber: Joi.string()
      .required()
      .pattern(PHONE_RULE)
      .message(PHONE_RULE_MESSAGE),
    password: Joi.string()
      .required()
      .pattern(PASSWORD_RULE)
      .message('Thông tin không hợp lệ!')
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const socialLogin = (req, res, next) => {
  const { provider, code, authorization_code, codeVerifier } = req.body

  if (provider !== 'google' && provider !== 'zalo') {
    return next(new ApiError(StatusCodes.BAD_REQUEST, 'Provider không hỗ trợ'))
  }

  if (
    (provider === 'google' && !code) ||
    (provider === 'zalo' && (!authorization_code || !codeVerifier))
  ) {
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        'Thiếu hoặc sai thông tin xác thực cho social login'
      )
    )
  }
  next()
}

const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    fullName: Joi.string().min(5).max(30).trim(),
    email: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    phoneNumber: Joi.string().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE),
    password: Joi.string()
      .pattern(PASSWORD_RULE)
      .message(`Mật khẩu cũ: ${PASSWORD_RULE_MESSAGE}`),
    newPassword: Joi.string()
      .pattern(PASSWORD_RULE)
      .message(`Mật khẩu mới: ${PASSWORD_RULE_MESSAGE}`)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const userValidation = {
  createNew,
  verifyAccount,
  login,
  socialLogin,
  update
}
