export async function verifyTurnstileToken(
  token: unknown,
  remoteIp?: string
) {
  if (!token || typeof token !== 'string') {
    return { success: false }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.error('Missing TURNSTILE_SECRET_KEY')
    return { success: false }
  }

  const formData = new FormData()
  formData.append('secret', secret)
  formData.append('response', token)

  if (remoteIp && remoteIp !== 'unknown') {
    formData.append('remoteip', remoteIp)
  }

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData,
    }
  )

  const data = await response.json()

  return {
    success: Boolean(data.success),
    errorCodes: data['error-codes'] || [],
  }
}