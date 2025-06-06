import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import {
  PHONE_RULE,
  PHONE_RULE_MESSAGE,
  FIELD_REQUIRED_RULE_MESSAGE,
  OTP_RULE,
  OTP_LENGTH_MESSAGE,
  OTP_RULE_MESSAGE
} from '~/utils/validator'

const validateRequestOtp = async (req, res, next) => {
  const correctCondition = Joi.object({
    phoneNumber: Joi.string().required().pattern(PHONE_RULE).messages({
      'string.empty': FIELD_REQUIRED_RULE_MESSAGE,
      'string.pattern.base': PHONE_RULE_MESSAGE
    }),
    actionType: Joi.string().required().valid('register', 'reset-password')
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, new Error(error).message))
  }
}

const validateVerifyOtp = async (req, res, next) => {
  const correctCondition = Joi.object({
    phoneNumber: Joi.string().required().pattern(PHONE_RULE).messages({
      'string.empty': FIELD_REQUIRED_RULE_MESSAGE,
      'string.pattern.base': PHONE_RULE_MESSAGE
    }),
    code: Joi.string().length(4).required().pattern(OTP_RULE).messages({
      'string.empty': FIELD_REQUIRED_RULE_MESSAGE,
      'string.length': OTP_LENGTH_MESSAGE,
      'string.pattern.base': OTP_RULE_MESSAGE
    })
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, new Error(error).message))
  }
}

export const otpValidation = {
  validateRequestOtp,
  validateVerifyOtp
}
