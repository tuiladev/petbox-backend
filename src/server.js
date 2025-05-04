/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import { corsOptions } from './config/cors'
import AsyncExitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import cookieParser from 'cookie-parser'

const START_SERVER = () => {
  const app = express()

  // Fix web caching
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Use cookie-parser
  app.use(cookieParser())

  // Cross-Origin Resource Sharing (CORS)
  app.use(cors(corsOptions))

  // Enable req.body json data
  app.use(express.json())

  // Use APIs V1
  app.use('/v1', APIs_V1)

  // Middleware error handler
  app.use(errorHandlingMiddleware)

  app.get('/', (req, res) => {
    res.send('Backend comming soon ...')
  })

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`I am running at http://${env.APP_HOST}:${env.APP_PORT}/`)
  })

  // Cleanup trước khi server bị đóng
  AsyncExitHook(() => {
    CLOSE_DB()
  })
}

;(async () => {
  try {
    console.log('-> Connecting to MongoDB Cloud Atlas ...')
    await CONNECT_DB()
    console.log('-> Connected to MongoDB Cloud Atlas!')
    START_SERVER()
  } catch (error) {
    console.error(error)
  }
})()
