import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { productService } from '~/services/productService'

export const getProductBySlug = async (req, res, next) => {
  const { slug } = req.params
  try {
    const product = await productService.getProductBySlug(slug)
    if (!product) {
      return next(
        new ApiError(
          StatusCodes.NOT_FOUND,
          `Product with slug '${slug}' not found`
        )
      )
    }
    res.status(StatusCodes.OK).json(product)
  } catch (error) {
    next(error)
  }
}

export const productController = {
  getProductBySlug
}
