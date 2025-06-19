import { env } from '~/utils/environment'

const exchangeCodeForToken = async code => {
  const params = new URLSearchParams()
  params.append('code', code)
  params.append('client_id', env.GOOGLE_CLIENT_ID)
  params.append('client_secret', env.GOOGLE_CLIENT_SECRET)
  params.append('redirect_uri', env.GOOGLE_REDIRECT_URI)
  params.append('grant_type', 'authorization_code')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(
      `Lỗi khi trao đổi code: ${data.error} - ${data.error_description}`
    )
  }

  return data
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

  return await response.json()
}

export const GoogleProvider = {
  exchangeCodeForToken,
  getUserInfo
}
