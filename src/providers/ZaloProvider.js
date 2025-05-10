import { env } from '~/config/environment'

const exchangeCodeForToken = async (data) => {
  const { authorization_code, codeVerifier } = data
  const response = await fetch('https://oauth.zaloapp.com/v4/access_token ', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'secret_key': env.ZALO_APP_SECRET
    },
    body: JSON.stringify({
      code: authorization_code,
      app_id: env.ZALO_APP_ID,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    })
  })

  return await response.json()
}

const refreshAccessToken = async (refreshToken, appId, secretKey) => {
  const response = await fetch('https://oauth.zaloapp.com/v4/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'secret_key': secretKey
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
      app_id: appId,
      grant_type: 'refresh_token'
    })
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`Refresh token failed: ${data.error} - ${data.message}`)
  }
  return data.access_token
}

const getUserInfo = async (accessToken, refreshToken, appId, secretKey) => {
  const fetchUser = async (token) => {
    const response = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
      method: 'GET',
      headers: {
        'access_token': token
      }
    })
    return await response.json()
  }

  let data = await fetchUser(accessToken)

  if (data.error) {
    const newAccessToken = await refreshAccessToken(refreshToken, appId, secretKey)
    data = await fetchUser(newAccessToken)
  }

  if (data.error) {
    throw new Error(`Cannot get user info: ${data.error} - ${data.message}`)
  }

  console.log('Data from zalo provider: ', data)

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