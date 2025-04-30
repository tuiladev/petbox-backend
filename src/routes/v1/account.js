import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { accountValidation, userValidation } from '~/validations/accountValidation'

const Router = express.Router()

Router.route('/abc')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: Account logined!' })
  })
  .post(accountValidation.createNew)

export const accountRoutes = Router
