import { env } from '~/utils/environment'

const exchangeCodeForToken = async ({ authorization_code, codeVerifier }) => {
  const params = new URLSearchParams()
  params.append('code', authorization_code)
  params.append('app_id', env.ZALO_APP_ID)
  params.append('grant_type', 'authorization_code')
  params.append('code_verifier', codeVerifier)

  const response = await fetch('https://oauth.zaloapp.com/v4/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      secret_key: env.ZALO_APP_SECRET
    },
    body: params
  })
  return await response.json()
}

const refreshAccessToken = async (refreshToken, appId, secretKey) => {
  const params = new URLSearchParams()
  params.append('refresh_token', refreshToken)
  params.append('app_id', appId)
  params.append('grant_type', 'refresh_token')

  const response = await fetch('https://oauth.zaloapp.com/v4/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      secret_key: secretKey
    },
    body: params
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`Refresh token failed: ${data.error} - ${data.message}`)
  }
  return data.access_token
}

const getUserInfo = async (accessToken, refreshToken) => {
  const fetchUser = async token => {
    const response = await fetch(
      'https://graph.zalo.me/v2.0/me?fields=id,name,picture',
      {
        method: 'GET',
        headers: {
          access_token: token
        }
      }
    )
    return await response.json()
  }

  let data = await fetchUser(accessToken)

  if (data.error) {
    const newAccessToken = await refreshAccessToken(
      refreshToken,
      env.ZALO_APP_ID,
      env.ZALO_APP_SECRET
    )
    data = await fetchUser(newAccessToken)
  }

  if (data.error) {
    throw new Error(`Cannot get user info: ${data.error} - ${data.message}`)
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.picture
  }
}

export const ZaloProvider = {
  exchangeCodeForToken,
  getUserInfo
}
