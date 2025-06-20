import { env } from '~/utils/environment'
import { ERROR_CODES, SystemError } from '~/utils/error'
import { logger } from '~/config/logger'

/**
 * Exchanges Google OAuth2 code for access and refresh tokens.
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} Token response JSON
 * @throws {SystemError} When Google OAuth2 returns an error status
 */
export async function exchangeCodeForToken(code) {
  logger.info(
    `Starting token exchange with Google OAuth2 for code: ${code} ....`
  )

  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri:
      env.BUILD_MODE === 'production'
        ? env.GOOGLE_REDIRECT_URI
        : env.WEBSITE_DOMAIN_DEVELOPMENT,
    grant_type: 'authorization_code'
  })

  // Perform HTTP POST to exchange code
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  // Handle non-OK responses
  if (!response.ok) {
    const errorText = await response.text()
    logger.error(
      'Google OAuth2 token exchange failed:',
      response.status,
      response.statusText,
      errorText
    )
    throw new SystemError(
      ERROR_CODES.SYSTEM_EXTERNAL_ERROR,
      `Google OAuth2 responded with status ${response.status} ${response.statusText}`,
      errorText
    )
  }

  const tokenData = await response.json()
  logger.info('Google OAuth2 token exchange successful !')
  return tokenData
}

/**
 * Retrieves user profile information from Google using the access token.
 * @param {string} accessToken - Google OAuth2 access token
 * @returns {Promise<Object>} Google user info JSON
 * @throws {SystemError} When request fails or returns non-OK status
 */
const getUserInfo = async accessToken => {
  logger.info('Fetching Google user info with access token ....')
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      logger.error(
        'Google userinfo fetch failed:',
        response.status,
        response.statusText,
        errText
      )
      throw new SystemError(
        ERROR_CODES.SYSTEM_EXTERNAL_ERROR,
        `Google Provider: failed to fetch user info with status ${response.status} ${response.statusText}`,
        errText
      )
    }

    const userInfo = await response.json()
    logger.info('Google userinfo fetched successfully !')
    return userInfo
  } catch (error) {
    logger.error('Error retrieving Google account info:', error)
    throw new SystemError(
      ERROR_CODES.SYSTEM_INTERNAL_ERROR,
      'Error when getting Google account info',
      error
    )
  }
}

export const GoogleProvider = {
  exchangeCodeForToken,
  getUserInfo
}
