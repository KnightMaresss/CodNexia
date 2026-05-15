import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { getJwtSecret } from '@/lib/jwt-secret'
const JWT_SECRET = new TextEncoder().encode(getJwtSecret())

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    if (payload.role !== 'student' && payload.role !== 'founder' && payload.role !== 'moderator') {
      return NextResponse.json({ authenticated: false })
    }

    // Check if user is blocked
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'student_services')
    const { ObjectId } = await import('mongodb')
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(payload.userId as string) }
    )
    
    if (user?.blocked) {
      return NextResponse.json({ authenticated: false, blocked: true })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role || 'student',
      },
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}