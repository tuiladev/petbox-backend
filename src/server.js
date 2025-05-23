/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import { corsOptions } from './config/cors.js'
import AsyncExitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import cookieParser from 'cookie-parser'

// Routes
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'

const START_SERVER = () => {
  const app = express()

  // Fix web caching
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Cookie parser
  app.use(cookieParser())

  // CORS
  app.use(cors(corsOptions))

  // JSON body
  app.use(express.json())

  // API v1 routes
  app.use('/v1', APIs_V1)

  // Error handler
  app.use(errorHandlingMiddleware)

  // Health check
  app.get('/', (req, res) => {
    res.send('Backend coming soon ...')
  })

  const port =
    env.BUILD_MODE === 'production' ? process.env.PORT : env.LOCAL_DEV_APP_PORT
  const host = env.LOCAL_DEV_APP_HOST

  if (env.BUILD_MODE === 'production') {
    app.listen(port, () => {
      console.log(`Render server is running at: ${port}`)
    })
  } else {
    app.listen(port, host, () => {
      console.log(`I am running at http://${host}:${port}/`)
    })
  }

  // Cleanup before exit
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
