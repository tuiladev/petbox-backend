import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { otpValidation } from '~/validations/otpValidation'

const Router = express.Router()

Router.route('/register').post(
  authMiddleware.isVerifyOTP,
  userValidation.createNew,
  userController.createNew
)

Router.route('/login').post(userValidation.login, userController.login)

Router.route('/social-login').post(
  userValidation.socialLogin,
  userController.socialLogin
)

Router.route('/logout').delete(userController.logout)

Router.route('/refresh-token').get(userController.refreshToken)

Router.route('/reset-password').put(
  authMiddleware.isVerifyOTP,
  userValidation.update,
  userController.update
)

Router.route('/update').put(
  authMiddleware.isAuthorized,
  userValidation.update,
  userController.update
)

Router.route('/request-otp').post(
  otpValidation.validateRequestOtp,
  userController.requestOtp
)

Router.route('/verify-otp').post(
  otpValidation.validateVerifyOtp,
  userController.verifyOtp
)

export const userRoutes = Router
