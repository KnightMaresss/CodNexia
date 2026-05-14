const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60_000) {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  // Clean up old entries every 10 minutes
  if (rateLimitMap.size > 1000) {
    const tenMinutesAgo = now - 600_000
    for (const [key, value] of rateLimitMap) {
      if (value.resetTime < tenMinutesAgo) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}