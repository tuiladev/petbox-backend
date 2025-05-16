import { env } from '~/config/environment'

const exchangeCodeForToken = async code => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  })

  if (!response.ok) {
    throw new Error(
      `Lỗi khi trao đổi code: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return data.access_token
}

const getUserInfo = async accessToken => {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Lỗi lấy thông tin user: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  return data
}

export const GoogleProvider = {
  exchangeCodeForToken,
  getUserInfo
}
