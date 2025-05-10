import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoutes } from './userRoute'

const Router = express.Router()

// User APIs
Router.use('/users', userRoutes)

export const APIs_V1 = Router
