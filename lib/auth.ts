import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function verifyAuth() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('student_token')?.value

    if (!token) {
      return false
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const adminRoles = ['founder', 'moderator']
    const isAdmin = adminRoles.includes(payload.role as string)
    
    return isAdmin
  } catch  {
    return false
  }
}