import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/jwt-secret'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export type CurrentUser = {
  _id: string
  id: string
  email?: string
  name?: string
  role?: string
  isAdmin: boolean
}

async function getAuthPayload() {
  const cookieStore = await cookies()

  const token =
    cookieStore.get('admin_token')?.value ||
    cookieStore.get('student_token')?.value

  if (!token) {
    return null
  }

  const { payload } = await jwtVerify(token, JWT_SECRET)

  return payload
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const payload = await getAuthPayload()

    if (!payload) {
      return null
    }

    const userId =
      payload.userId ||
      payload.id ||
      payload._id ||
      payload.sub

    if (!userId) {
      return null
    }

    const role = payload.role as string | undefined
    const adminRoles = ['founder', 'moderator']

    return {
      _id: String(userId),
      id: String(userId),
      email: payload.email ? String(payload.email) : undefined,
      name: payload.name ? String(payload.name) : undefined,
      role,
      isAdmin: role ? adminRoles.includes(role) : false,
    }
  } catch {
    return null
  }
}

export async function verifyAuth() {
  try {
    const payload = await getAuthPayload()

    if (!payload) {
      return false
    }

    const adminRoles = ['founder', 'moderator']
    const isAdmin = adminRoles.includes(payload.role as string)

    return isAdmin
  } catch {
    return false
  }
}