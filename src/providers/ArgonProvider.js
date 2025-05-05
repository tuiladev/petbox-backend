import argon2 from 'argon2'
import crypto from 'crypto'

// Based on OWASP cheat sheet recommendations (as of March, 2022)
const hashingConfig = {
  parallelism: 1,
  memoryCost: 64000,
  timeCost: 3
}

const hashPassword = async (password) => {
  let salt = crypto.randomBytes(16)
  return await argon2.hash(password, {
    ...hashingConfig,
    salt
  })
}

const verifyPasswordWithHash = async (password, hash) => {
  return await argon2.verify(hash, password, hashingConfig)
}

export const ArgonProvider = {
  hashPassword,
  verifyPasswordWithHash
}