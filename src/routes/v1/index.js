import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoutes } from './userRoute'
import { productRoutes } from './productRoute'

const Router = express.Router()

// Check APIs v1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok' })
})

// User APIs
Router.use('/users', userRoutes)

// Product APIs
Router.use('/products', productRoutes)

export const APIs_V1 = Router
