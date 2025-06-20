import Joi from 'joi'
import { ValidationError } from '~/utils/error'

const getProductBySlug = async (req, res, next) => {
  const correctCondition = Joi.object({
    slug: Joi.string().trim().min(1).required()
  })

  try {
    await correctCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    next(new ValidationError.fromJoi(error))
  }
}

export const productValidation = {
  getProductBySlug
}
