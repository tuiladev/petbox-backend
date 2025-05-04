import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoutes } from './userRoute'

const Router = express.Router()

// Check APIs v1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok' })
})

// User APIs
Router.use('/users', userRoutes)

export const APIs_V1 = Router
