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

  return await response.json().access_token
}

const getUserInfo = async (accessToken) => {
  const response = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
    method: 'GET',
    headers: {
      'access_token': accessToken
    }
  })
  const data = await response.json()
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