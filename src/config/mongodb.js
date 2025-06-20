import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/utils/environment'

// Holds the database instance after connecting
let petboxDatabase = null

// Create a new MongoClient with server API options
const mongoClient = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1, // Use the stable API version v1
    strict: true, // Enforce strict API adherence
    deprecationErrors: true // Throw on deprecated features
  }
})

/**
 * CONNECT_DB
 * Connects the MongoClient to the database server and sets the database instance.
 */
export const CONNECT_DB = async () => {
  await mongoClient.connect() // Establish connection
  petboxDatabase = mongoClient.db(env.DATABASE_NAME) // Select and store database
}

/**
 * CLOSE_DB
 * Closes the active MongoClient connection.
 */
export const CLOSE_DB = async () => {
  await mongoClient.close() // Cleanly close connection
}

/**
 * GET_DB
 * Returns the connected database instance or throws if not connected.
 * @returns {import('mongodb').Db} The MongoDB database instance
 */
export const GET_DB = () => {
  if (!petboxDatabase) {
    throw new Error('Must connect to Database first!') // Enforce initialization order
  }
  return petboxDatabase // Return the active database instance
}
