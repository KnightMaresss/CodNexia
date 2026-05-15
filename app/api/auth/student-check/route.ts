import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
import { canAccessAdmin } from '@/lib/roles'

const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const role = typeof payload.role === 'string' ? payload.role : null

    const isStudent = role === 'student'
    const isAdmin = canAccessAdmin(role)

    if (!isStudent && !isAdmin) {
      return NextResponse.json({ authenticated: false })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')

    const { ObjectId } = await import('mongodb')

    const userId =
      typeof payload.userId === 'string' ? payload.userId : null

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ authenticated: false })
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    })

    if (user?.blocked) {
      return NextResponse.json({
        authenticated: false,
        blocked: true,
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email:
          typeof payload.email === 'string' ? payload.email : '',
        role: role || 'student',
      },
    })
  } catch (error) {
    console.error('Student auth check error:', error)

    return NextResponse.json({ authenticated: false })
  }
}