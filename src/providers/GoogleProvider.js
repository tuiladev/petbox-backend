import { env } from '~/config/environment'
const exchangeCodeForToken = async (code) => {
  try {
    console.log('Đang trao đổi code với redirect URI:', env.GOOGLE_REDIRECT_URI)

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
      const errorText = await response.text()
      console.error('Google OAuth Error:', response.status, errorText)
      throw new Error(`Lỗi khi trao đổi code: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Chi tiết lỗi:', error)
    throw error
  }
}


const getUserInfo = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!res.ok) {
    const errText = await res.text() // lấy nội dung lỗi
    throw new Error(`Lỗi lấy thông tin user: ${res.status} - ${errText}`)
  }

  const data = await res.json()
  console.log('User Info:', data) // in ra dữ liệu thật
  return data
}


export const GoogleProvider = {
  exchangeCodeForToken,
  getUserInfo
}