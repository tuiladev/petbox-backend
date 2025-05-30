import express from 'express'
import { productValidation } from '~/validations/productValidation'
import { productController } from '~/controllers/productController'

const Router = express.Router()

Router.route('/:slug').get(
  productValidation.getProductBySlug,
  productController.getProductBySlug
)

export const productRoutes = Router
