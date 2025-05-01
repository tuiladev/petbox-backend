import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { accountValidation } from '~/validations/accountValidation'
import { accountController } from '~/controllers/accountController'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: Account authenticated!' })
  })
  // post(define layer to excute the request: server -> validation -> middleware -> controller -> model -> response to browser)
  .post(accountValidation.createNew, accountController.createNew)

export const accountRoutes = Router
