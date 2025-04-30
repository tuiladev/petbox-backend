import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

let petboxDatabase = null
const mongoClient = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const CONNECT_DB = async () => {
  await mongoClient.connect()
  petboxDatabase = mongoClient.db(env.DATABASE_NAME)
}

export const CLOSE_DB = async () => {
  await mongoClient.close()
}

export const GET_DB = () => {
  if (!petboxDatabase) {
    throw new Error('Must connect to Database first!')
  }
  return petboxDatabase
}
