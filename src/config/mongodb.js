import { MongoClient, ServerApiVersion } from 'mongodb'
import 'dotenv/config'
const MONGODB_URI = process.env.MONGODB_URI
const DATABASE_NAME = process.env.DATABASE_NAME

let petboxDatabase = null
const mongoClient = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const CONNECT_DB = async () => {
  await mongoClient.connect()
  petboxDatabase = mongoClient.db(DATABASE_NAME)
}

export const GET_DB = () => {
  if (!petboxDatabase) {
    throw new Error('Must connect to Database first!')
  }
  return petboxDatabase
}
