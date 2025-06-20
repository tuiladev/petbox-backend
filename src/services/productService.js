import { StatusCodes } from 'http-status-codes'
import { ApiError, ERROR_CODES } from '~/utils/error'
import { productModel } from '~/models/productModel'

export const getProductBySlug = async slug => {
  const product = await productModel.findOneBySlug(slug)
  if (!product)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.PRODUCT_NOT_FOUND,
      'Product not found!'
    )
  const variants = await productModel.getProductVariants(product)
  return { ...product, variants }
}

export const productService = {
  getProductBySlug
}
