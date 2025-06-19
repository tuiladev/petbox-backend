import express from 'express'
import { storeController } from '~/controllers/storeController'
const Router = express.Router()

Router.route('/:code').get(storeController.getStoreInfo)

export const storeRoutes = Router
