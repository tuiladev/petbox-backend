import { createClient } from 'redis'
import { env } from '~/utils/environment'
import { logger } from '~/config/logger'

// Initialize Redis client with authentication and connection settings
const client = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT
  }
})

// Log any client-level errors
client.on('error', err => logger.error('Redis Client Error:', err))

/**
 * Ensures the Redis client is connected before any operation.
 */
const connectRedis = async () => {
  if (!client.isOpen) {
    logger.info('Connecting to Redis...')
    await client.connect()
    logger.info('Redis connection established')
  }
}

/**
 * Retrieves a numeric value by key from Redis
 * @param {string} key - Redis key
 * @param {number} defaultValue - Default number if key doesn't exist or parse fails
 * @returns {Promise<number>} Parsed number
 */
const getNumber = async (key, defaultValue = 0) => {
  await connectRedis()
  logger.info(`Getting Redis number for key: ${key}`)

  try {
    const value = await client.get(key)

    if (value === null || value === undefined) {
      logger.info(`Key ${key} not found, returning default: ${defaultValue}`)
      return defaultValue
    }

    const result = Number(value)
    if (isNaN(result)) {
      logger.warn(
        `Cannot parse "${value}" as number, returning default: ${defaultValue}`
      )
      return defaultValue
    }

    logger.info(`Number for ${key}: ${result}`)
    return result
  } catch (error) {
    logger.error(`Error getting Redis number ${key}:`, error)
    return defaultValue
  }
}

/**
 * Retrieves an object/array/complex data by key from Redis
 * @param {string} key - Redis key
 * @param {any} defaultValue - Default value if key doesn't exist or parse fails
 * @returns {Promise<any>} Parsed object/array/data
 */
const getObject = async (key, defaultValue = null) => {
  await connectRedis()
  logger.info(`Getting Redis object for key: ${key}`)

  try {
    const value = await client.get(key)

    if (value === null || value === undefined) {
      logger.info(`Key ${key} not found, returning default value`)
      return defaultValue
    }

    try {
      const result = JSON.parse(value)
      logger.info(`Object for ${key}: ${JSON.stringify(result)}`)
      return result
    } catch (parseError) {
      logger.warn(`Cannot parse "${value}" as JSON, returning raw string`)
      return value // Fallback to string if not JSON
    }
  } catch (error) {
    logger.error(`Error getting Redis object ${key}:`, error)
    return defaultValue
  }
}

/**
 * Sets a key to a value with TTL.
 * @param {string} key - Redis key
 * @param {string|number} value - Value to store
 * @param {number} ttl - Time-to-live in seconds
 */
const set = async (key, value, ttl) => {
  await connectRedis()
  logger.info(`Setting Redis key ${key} to ${value} with TTL ${ttl}s`)
  await client.set(key, value, { EX: ttl })
}

/**
 * Increments the numeric value of a key by 1.
 * @param {string} key - Redis key
 * @returns {Promise<number>} The new value after increment
 */
const incr = async key => {
  await connectRedis()
  logger.info(`Incrementing Redis key: ${key}`)
  const newValue = await client.incr(key)
  logger.info(`New value for ${key}: ${newValue}`)
  return newValue
}

/**
 * Updates the TTL of a given key.
 * @param {string} key - Redis key
 * @param {number} ttl - New time-to-live in seconds
 */
const expire = async (key, ttl) => {
  await connectRedis()
  logger.info(`Setting TTL for ${key} to ${ttl}s`)
  await client.expire(key, ttl)
}

export const RedisProvider = {
  getNumber,
  getObject,
  set,
  incr,
  expire
}
