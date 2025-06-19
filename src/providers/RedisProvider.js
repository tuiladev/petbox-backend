import { createClient } from 'redis'
import { env } from '~/utils/environment'

const client = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT
  }
})

client.on('error', err => console.log('Redis Client Error:', err))

const connectRedis = async () => {
  if (!client.isOpen) await client.connect()
}

const get = async key => {
  await connectRedis()
  const value = await client.get(key)
  return value ? Number(value) : 0
}

const set = async (key, value, ttl) => {
  await connectRedis()
  await client.set(key, value, { EX: ttl })
}

const incr = async key => {
  await connectRedis()
  return await client.incr(key)
}

const expire = async (key, ttl) => {
  await connectRedis()
  await client.expire(key, ttl)
}

export const RedisProvider = {
  get,
  set,
  incr,
  expire
}
