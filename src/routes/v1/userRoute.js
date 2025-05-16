import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/register').post(
  userValidation.createNew,
  userController.createNew
)

// Login with account
Router.route('/login').post(userValidation.login, userController.login)

// Social Login
Router.route('/google-login').post(
  userValidation.googleLogin,
  userController.googleLogin
)

Router.route('/zalo-login').post(
  userValidation.zaloLogin,
  userController.zaloLogin
)

Router.route('/logout').delete(userController.logout)

Router.route('/refresh-token').get(userController.refreshToken)

Router.route('/update').put(
  authMiddleware.isAuthorized,
  userValidation.update,
  userController.update
)

export const userRoutes = Router
