import crypto from 'crypto'

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  return {
    token,
    tokenHash,
  }
}

export function hashEmailVerificationToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getEmailVerificationExpiry() {
  return new Date(Date.now() + 60 * 60 * 1000)
}