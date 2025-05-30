import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const getProductBySlug = async (req, res, next) => {
  const schema = Joi.object({
    slug: Joi.string().trim().min(1).required()
  })

  try {
    await schema.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const productValidation = {
  getProductBySlug
}
