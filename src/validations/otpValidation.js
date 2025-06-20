import Joi from 'joi'
import { ValidationError } from '~/utils/error'
import { PHONE_RULE, OTP_RULE } from '~/utils/validator'

const validateRequestOtp = async (req, res, next) => {
  const correctCondition = Joi.object({
    phone: Joi.string().pattern(PHONE_RULE).required(),
    actionType: Joi.string()
      .valid('register', 'social-register', 'reset-password')
      .required()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    req.logger.info('Request OTP pass validation with payload: ', req.body)
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
    req.logger.info('Verify OTP pass validation with payload: ', req.body)
    next()
  } catch (error) {
    next(new ValidationError.fromJoi(error))
  }
}

export const otpValidation = {
  validateRequestOtp,
  validateVerifyOtp
}
