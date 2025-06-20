import Joi from 'joi'
import { ValidationError } from '~/utils/error'
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
    phone: Joi.string().required().pattern(PHONE_RULE),
    actionType: Joi.string().required().valid('register', 'reset-password')
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ValidationError.fromJoi(error))
  }
}

const validateVerifyOtp = async (req, res, next) => {
  const correctCondition = Joi.object({
    phone: Joi.string().required().pattern(PHONE_RULE),
    code: Joi.string().length(4).required().pattern(OTP_RULE)
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ValidationError.fromJoi(error))
  }
}

export const otpValidation = {
  validateRequestOtp,
  validateVerifyOtp
}
