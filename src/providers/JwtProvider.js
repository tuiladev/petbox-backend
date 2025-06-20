import JWT from 'jsonwebtoken'
import { logger } from '~/config/logger'
import { ERROR_CODES, SystemError } from '~/utils/error'

/**
 * Signs the provided userInfo into a JWT.
 * @param {Object} userInfo - Payload to include in the token
 * @param {string} secretSignature - Secret key for signing
 * @param {string|number} tokenLife - Token lifetime (e.g., '15m', '7d')
 * @returns {Promise<string>} Signed JWT
 * @throws {SystemError} On signing failure
 */
const generateToken = async (userInfo, secretSignature, tokenLife) => {
  logger.info('Generating JWT with payload:', userInfo)
  try {
    const token = JWT.sign(userInfo, secretSignature, {
      algorithm: 'HS256',
      expiresIn: tokenLife
    })
    logger.info('JWT generation successful')
    return token
  } catch (error) {
    logger.error('Error generating JWT:', error)
    throw new SystemError(
      ERROR_CODES.SYSTEM_INTERNAL_ERROR,
      'Failed to generate token',
      error
    )
  }
}

/**
 * Verifies the provided JWT and returns its decoded payload.
 * @param {string} token - JWT string to verify
 * @param {string} secretSignature - Secret key for verification
 * @returns {Promise<Object>} Decoded token payload
 * @throws {SystemError} On verification failure
 */
const verifyToken = async (token, secretSignature) => {
  logger.info('Verifying JWT')
  try {
    const decoded = JWT.verify(token, secretSignature, { algorithm: 'HS256' })
    logger.info('JWT verification successful')
    return decoded
  } catch (error) {
    logger.error('Error verifying JWT:', error)
    throw new SystemError(
      ERROR_CODES.SYSTEM_INTERNAL_ERROR,
      'Failed to verify token',
      error
    )
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}
