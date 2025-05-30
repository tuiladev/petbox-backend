import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { productModel } from '~/models/productModel'

export const getProductBySlug = async slug => {
  const product = await productModel.findOneBySlug(slug)
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!')
  const variants = await productModel.getProductVariants(product)
  return { ...product, variants }
}

export const productService = {
  getProductBySlug
}
