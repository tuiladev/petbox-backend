const exchangeCodeForToken = async (code) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  })

  if (!response.ok) throw new Error(`Lỗi khi trao đổi code: ${response.statusText}`)
  console.log(response.json())
  return response.json()
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