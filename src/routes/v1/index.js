import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { requestLogger } from '~/middlewares/requestLoggerMiddleware'
import { userRoutes } from './userRoute'
import { productRoutes } from './productRoute'
import { storeRoutes } from './storeRoute'

const Router = express.Router()

// Check APIs v1 status
Router.get('/status', requestLogger('api service'), (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok' })
})

// User APIs
Router.use('/users', requestLogger('user service'), userRoutes)

// Product APIs
Router.use('/products', requestLogger('product service'), productRoutes)

// Store APIs
Router.use('/stores', requestLogger('store service'), storeRoutes)

export const APIs_V1 = Router
