/* eslint-disable no-console */
import express from 'express'
import { CONNECT_DB } from '~/config/mongodb'
import 'dotenv/config'

const PORT = process.env.APP_PORT || 8017
const HOSTNAME = process.env.APP_HOST || 'localhost'

const START_SERVER = () => {
  const app = express()
  app.get('/', (req, res) => {
    res.send('Server is running ...')
  })
  app.listen(PORT, HOSTNAME, () => {
    console.log(`I am running at http://${HOSTNAME}:${PORT}/`)
  })
}

(async () => {
  try {
    console.log('-> Connecting to database ...')
    await CONNECT_DB()
    console.log('-> Connected to database successfully!')
    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()
