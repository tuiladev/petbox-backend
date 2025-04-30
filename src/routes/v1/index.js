import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { accountRoutes } from './account'

const Router = express.Router()

// Check APIs v1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok' })
})

// Account APIs
Router.use('/auth', accountRoutes)

export const APIs_V1 = Router
