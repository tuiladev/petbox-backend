import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    // Data or condition to validate
    fullName: Joi.string().required().min(3).max(50).trim().strict()
  })

  try {
    // abortEarly: false => return all errors at once (not stop early when first error found)
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    // use next() to go back account(route) and continue to next step define in route
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const accountValidation = {
  createNew
  // another validation...
}
