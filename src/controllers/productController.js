import { ApiError, ERROR_CODES } from '~/utils/apiError'
import { StatusCodes } from 'http-status-codes'
import { productService } from '~/services/productService'

export const getProductBySlug = async (req, res, next) => {
  const { slug } = req.params
  try {
    const product = await productService.getProductBySlug(slug)
    res.status(StatusCodes.OK).json(product)
  } catch (error) {
    next(error)
  }
}

export const productController = {
  getProductBySlug
}
